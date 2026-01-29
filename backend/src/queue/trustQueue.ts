/**
 * Evaluation Queue
 * BullMQ queue for processing evaluation jobs
 */

import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import type { EvaluationJobData } from '../lib/evaluation/index.js';

// Queue name
export const EVALUATION_QUEUE_NAME = 'evaluation-jobs';

// Create the evaluation queue
export const evaluationQueue = new Queue<EvaluationJobData>(
    EVALUATION_QUEUE_NAME,
    {
        connection: redisConfig,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: 50, // Keep last 50 failed jobs
        },
    }
);

/**
 * Add a job to the queue
 */
export async function enqueueEvaluationJob(data: EvaluationJobData) {
    return evaluationQueue.add('evaluation', data, {
        jobId: data.jobId, // Use our job ID as BullMQ job ID
    });
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        evaluationQueue.getWaitingCount(),
        evaluationQueue.getActiveCount(),
        evaluationQueue.getCompletedCount(),
        evaluationQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}
