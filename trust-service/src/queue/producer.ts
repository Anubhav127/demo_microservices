// BullMQ queue producer
import { Queue } from 'bullmq';
import { QUEUE_NAME, redisConnection } from './config';
import { JobPayload } from '../types';

// Create queue instance
const queue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
    },
});

/**
 * Enqueue an evaluation job
 * @param payload Job payload containing evaluation instructions
 * @returns The BullMQ job
 */
export async function enqueueJob(payload: JobPayload): Promise<void> {
    console.log(`[Queue] Enqueueing job ${payload.job_id} for ${payload.metric_type} evaluation`);

    await queue.add(payload.metric_type, payload, {
        jobId: payload.job_id, // Use DB job ID as BullMQ job ID for idempotency
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });

    console.log(`[Queue] Job ${payload.job_id} enqueued successfully`);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
}> {
    const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}

export { queue };
