import { Evaluation, EvaluationStatus, AIModel } from '../models';
import { csvLoader } from './CSVLoader';
import { aiModelClient } from './AIModelClient';
import { metricsCalculator } from './MetricsCalculator';
import { sendSSEUpdate } from '../routes/evaluations';

/**
 * Evaluation job message interface
 */
export interface EvaluationJobMessage {
    evaluationId: string;
    userId: string;
    projectId: string;
    modelId: string;
}

/**
 * Ground truth CSV file path
 */
const GROUND_TRUTH_CSV_PATH = process.env.GROUND_TRUTH_CSV_PATH || './data/ground_truth.csv';

/**
 * Process an evaluation job
 * @param job - The evaluation job message from Kafka
 */
export const processEvaluationJob = async (job: EvaluationJobMessage): Promise<void> => {
    console.log(`Processing evaluation job: ${job.evaluationId}`);

    try {
        // Find evaluation record
        const evaluation = await Evaluation.findByPk(job.evaluationId);
        if (!evaluation) {
            console.error(`Evaluation not found: ${job.evaluationId}`);
            return;
        }

        // Update status to IN_PROGRESS
        await evaluation.update({ status: EvaluationStatus.IN_PROGRESS });
        console.log(`Evaluation ${job.evaluationId} status: IN_PROGRESS`);

        // Send SSE update for IN_PROGRESS
        sendSSEUpdate(job.evaluationId, {
            id: job.evaluationId,
            status: EvaluationStatus.IN_PROGRESS,
        });

        // Get AI model endpoint
        const model = await AIModel.findByPk(job.modelId);
        if (!model) {
            throw new Error(`AI Model not found: ${job.modelId}`);
        }

        // Load ground truth CSV
        const groundTruth = await csvLoader.loadGroundTruth(GROUND_TRUTH_CSV_PATH);
        console.log(`Loaded ${groundTruth.length} ground truth rows`);

        // Collect predictions
        const predictions: number[] = [];
        const actuals: number[] = [];

        for (const row of groundTruth) {
            try {
                const response = await aiModelClient.predict(model.endpointUrl, row.input);
                predictions.push(response.prediction);
                actuals.push(row.expectedLabel);
            } catch (error) {
                console.error(`Prediction failed for row:`, error);
                throw error;
            }
        }

        // Compute metrics
        const metrics = metricsCalculator.compute(predictions, actuals);
        console.log(`Computed metrics:`, metrics);

        // Update evaluation with metrics and COMPLETED status
        await evaluation.update({
            status: EvaluationStatus.COMPLETED,
            accuracy: metrics.accuracy,
            precision: metrics.precision,
            recall: metrics.recall,
            f1Score: metrics.f1Score,
        });

        // Send SSE update for COMPLETED with metrics
        sendSSEUpdate(job.evaluationId, {
            id: job.evaluationId,
            status: EvaluationStatus.COMPLETED,
            accuracy: metrics.accuracy,
            precision: metrics.precision,
            recall: metrics.recall,
            f1Score: metrics.f1Score,
        });

        console.log(`✓ Evaluation ${job.evaluationId} completed successfully`);
    } catch (error) {
        console.error(`✗ Evaluation ${job.evaluationId} failed:`, error);

        // Mark evaluation as FAILED
        try {
            const evaluation = await Evaluation.findByPk(job.evaluationId);
            if (evaluation) {
                await evaluation.update({ status: EvaluationStatus.FAILED });

                // Send SSE update for FAILED
                sendSSEUpdate(job.evaluationId, {
                    id: job.evaluationId,
                    status: EvaluationStatus.FAILED,
                });
            }
        } catch (updateError) {
            console.error('Failed to update evaluation status to FAILED:', updateError);
        }
    }
};

export default processEvaluationJob;
