// Environment configuration for Trust Microservice
import 'dotenv/config';

export const config = {
    port: parseInt(process.env.PORT || '3002', 10),

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'trust_db',
        user: process.env.DB_USER || 'trust_user',
        password: process.env.DB_PASSWORD || 'trust_password',
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },

    worker: {
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
        lockDuration: 30 * 60 * 1000, // 30 minutes
        stalledInterval: 60 * 1000,   // 1 minute
        maxStalledCount: 1,
    },

    recovery: {
        intervalMs: 5 * 60 * 1000,     // 5 minutes
        timeoutMinutes: 30,
    },
};
