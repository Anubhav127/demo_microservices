// BullMQ job processor
import { Job } from 'bullmq';
import { sequelize } from '../db/config';
import { EvaluationJob, EvaluationResult } from '../db/models';
import { getModelArtifact } from '../mocks/modelRegistry';
import { loadDataset, loadDatasetWithGroups } from '../mocks/objectStorage';
import { evaluatePerformance } from './evaluators/performance';
import { evaluateFairness } from './evaluators/fairness';
import { evaluateEthics } from './evaluators/ethics';
import { evaluateRobustness } from './evaluators/robustness';
import { JobPayload, EvaluationMetrics } from '../types';

/**
 * Process an evaluation job
 */
export async function processJob(job: Job<JobPayload>): Promise<void> {
    const { job_id, model_id, metric_type, dataset_id, config } = job.data;

    console.log(`[Worker] Processing job ${job_id} for ${metric_type} evaluation`);
    console.log(`[Worker] Model: ${model_id}, Dataset: ${dataset_id}`);

    // 1. Atomic state transition QUEUED -> RUNNING
    const [, affectedRows] = await sequelize.query(`
        UPDATE evaluation_jobs
        SET status = 'RUNNING', started_at = NOW()
        WHERE id = :job_id AND status = 'QUEUED'
    `, {
        replacements: { job_id },
        type: 'UPDATE',
    }) as [any, number];

    // If 0 rows updated, job was already processed or cancelled
    if (affectedRows === 0) {
        console.log(`[Worker] Job ${job_id} already processed or invalid state, skipping`);
        return;
    }

    console.log(`[Worker] Job ${job_id} transitioned to RUNNING`);

    try {
        // 2. Fetch model artifact
        const model = await getModelArtifact(model_id);

        // 3. Fetch dataset
        const dataset = metric_type === 'fairness'
            ? await loadDatasetWithGroups(dataset_id)
            : await loadDataset(dataset_id);

        // 4. Run model inference
        const predictions = model.predict(dataset.inputs);

        // 5. Execute appropriate evaluator
        let summary: EvaluationMetrics;

        switch (metric_type) {
            case 'performance':
                summary = await evaluatePerformance(predictions, dataset);
                break;
            case 'fairness':
                summary = await evaluateFairness(predictions, dataset as Awaited<ReturnType<typeof loadDatasetWithGroups>>);
                break;
            case 'ethics':
                summary = await evaluateEthics(predictions, dataset, config);
                break;
            case 'robustness':
                summary = await evaluateRobustness(model.predict, dataset, config);
                break;
            default:
                throw new Error(`Unknown metric type: ${metric_type}`);
        }

        console.log(`[Worker] Job ${job_id} evaluation completed`);

        // 6. Persist results in transaction
        await sequelize.transaction(async (t) => {
            // Insert evaluation result
            await EvaluationResult.create({
                job_id,
                metric_type,
                summary: summary as unknown as Record<string, unknown>,
                created_at: new Date(),
            }, { transaction: t });

            // Update job status
            await EvaluationJob.update({
                status: 'COMPLETED',
                finished_at: new Date(),
            }, {
                where: { id: job_id },
                transaction: t,
            });
        });

        console.log(`[Worker] Job ${job_id} completed and persisted successfully`);

    } catch (error) {
        console.error(`[Worker] Job ${job_id} failed:`, error);

        // Update job to FAILED
        await EvaluationJob.update({
            status: 'FAILED',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            finished_at: new Date(),
        }, {
            where: { id: job_id },
        });

        // Re-throw to let BullMQ handle retries
        throw error;
    }
}
