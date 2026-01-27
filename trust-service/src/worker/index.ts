// Worker entry point
import { Worker } from 'bullmq';
import { QUEUE_NAME, redisConnection, workerOptions } from '../queue/config';
import { initializeDatabase } from '../db/config';
import { processJob } from './processor';
import { startRecoveryTask } from './recovery';
import { JobPayload } from '../types';

async function start(): Promise<void> {
    console.log('[Worker] Starting Trust Service Worker...');

    try {
        // Initialize database connection
        await initializeDatabase();
        console.log('[Worker] Database connection established');

        // Create BullMQ worker
        const worker = new Worker<JobPayload>(
            QUEUE_NAME,
            async (job) => {
                await processJob(job);
            },
            {
                connection: redisConnection,
                ...workerOptions,
            }
        );

        // Worker event handlers
        worker.on('completed', (job) => {
            console.log(`[Worker] Job ${job.id} completed successfully`);
        });

        worker.on('failed', (job, err) => {
            console.error(`[Worker] Job ${job?.id} failed:`, err.message);
        });

        worker.on('stalled', (jobId) => {
            console.warn(`[Worker] Job ${jobId} stalled`);
        });

        worker.on('error', (err) => {
            console.error('[Worker] Worker error:', err);
        });

        console.log(`[Worker] Worker started with concurrency ${workerOptions.concurrency}`);
        console.log(`[Worker] Listening on queue: ${QUEUE_NAME}`);

        // Start recovery task
        startRecoveryTask();

        // Graceful shutdown
        const shutdown = async () => {
            console.log('[Worker] Shutting down...');
            await worker.close();
            console.log('[Worker] Worker closed');
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('[Worker] Failed to start worker:', error);
        process.exit(1);
    }
}

start();
