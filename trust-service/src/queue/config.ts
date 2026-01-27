// BullMQ/Redis queue configuration
import { ConnectionOptions } from 'bullmq';
import { config } from '../config';

export const QUEUE_NAME = 'trust-evaluations';

export const redisConnection: ConnectionOptions = {
    host: config.redis.host,
    port: config.redis.port,
};

export const workerOptions = {
    concurrency: config.worker.concurrency,
    lockDuration: config.worker.lockDuration,
    stalledInterval: config.worker.stalledInterval,
    maxStalledCount: config.worker.maxStalledCount,
};
