/**
 * Redis Configuration for BullMQ
 */

import { Redis } from 'ioredis';

// Redis connection options
export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null, // Required for BullMQ
};

// Create Redis connection for BullMQ
export function createRedisConnection(): Redis {
    return new Redis(redisConfig);
}
