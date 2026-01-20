import { z } from 'zod';

/**
 * Environment configuration schema with Zod validation
 * Application fails fast on invalid configuration
 */
const envSchema = z.object({
    // Server Configuration
    PORT: z.string().default('3000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // JWT Configuration
    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
    JWT_EXPIRATION: z.string().default('15m'),

    // Service URLs
    AUTH_SERVICE_URL: z.string().url('AUTH_SERVICE_URL must be a valid URL'),
    TRUST_SERVICE_URL: z.string().url('TRUST_SERVICE_URL must be a valid URL').optional(),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

/**
 * Parse and validate environment variables
 * Throws on invalid configuration with detailed error messages
 */
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment configuration:');
        result.error.issues.forEach((issue) => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }

    return result.data;
};

export const config = parseEnv();

export type Config = typeof config;
