/**
 * Evaluation Worker
 * BullMQ worker that processes evaluation jobs
 */

import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { EVALUATION_QUEUE_NAME } from '../queue/index.js';
import * as evaluationService from '../lib/evaluation/evaluation.service.js';
import type { EvaluationJobData, ModuleType, MetricType } from '../lib/evaluation/index.js';

// Import evaluators from each module
import { trustEvaluators } from '../modules/trust/evaluators/index.js';

// Evaluator function signature
type EvaluatorFunction = (
    modelId: string,
    userId: string
) => Promise<{ score: number; details: Record<string, unknown> }>;

// Registry of all module evaluators
const moduleEvaluators: Record<ModuleType, Record<MetricType, EvaluatorFunction>> = {
    trust: trustEvaluators,
    // Add more modules here as they are implemented
    safety: trustEvaluators, // Placeholder - use trust evaluators for now
    reliability: trustEvaluators,
    compliance: trustEvaluators,
};

/**
 * Process an evaluation job
 */
async function processJob(job: Job<EvaluationJobData>): Promise<void> {
    const { jobId, modelId, userId, moduleType, metricType } = job.data;

    console.log(`[Worker] Processing job ${jobId}: ${moduleType}/${metricType} for model ${modelId}`);

    // Update status to processing
    evaluationService.updateJobStatus(jobId, 'processing');

    try {
        // Get the evaluator for this module and metric
        const evaluators = moduleEvaluators[moduleType];
        if (!evaluators) {
            throw new Error(`Unknown module type: ${moduleType}`);
        }

        const evaluator = evaluators[metricType];
        if (!evaluator) {
            throw new Error(`Unknown metric type: ${metricType}`);
        }

        // Run the evaluation
        const result = await evaluator(modelId, userId);

        // Store the result
        evaluationService.storeResult({
            jobId,
            modelId,
            userId,
            moduleType,
            metricType,
            score: result.score,
            details: result.details,
            evaluatedAt: new Date(),
        });

        // Update status to completed
        evaluationService.updateJobStatus(jobId, 'completed');

        console.log(`[Worker] Completed job ${jobId} with score: ${result.score}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Worker] Failed job ${jobId}:`, errorMessage);

        // Update status to failed
        evaluationService.updateJobStatus(jobId, 'failed', errorMessage);

        throw error; // Re-throw for BullMQ retry logic
    }
}

// Create the worker
export const evaluationWorker = new Worker<EvaluationJobData>(
    EVALUATION_QUEUE_NAME,
    processJob,
    {
        connection: redisConfig,
        concurrency: 5, // Process up to 5 jobs concurrently
    }
);

// Worker event handlers
evaluationWorker.on('ready', () => {
    console.log('[Worker] Evaluation worker is ready');
});

evaluationWorker.on('completed', (job: Job<EvaluationJobData>) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
});

evaluationWorker.on('failed', (job: Job<EvaluationJobData> | undefined, error: Error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
});

evaluationWorker.on('error', (error: Error) => {
    console.error('[Worker] Worker error:', error);
});

/**
 * Start the worker
 */
export async function startWorker(): Promise<void> {
    console.log('[Worker] Starting evaluation worker...');
    // Worker starts automatically when created
}

/**
 * Stop the worker gracefully
 */
export async function stopWorker(): Promise<void> {
    console.log('[Worker] Stopping evaluation worker...');
    await evaluationWorker.close();
    console.log('[Worker] Evaluation worker stopped');
}
