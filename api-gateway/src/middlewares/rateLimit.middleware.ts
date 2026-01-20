import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../lib/logger';

/**
 * Rate limiting middleware using express-rate-limit
 * Protects against abuse and DoS attacks
 */
export const rateLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            url: req.originalUrl,
        });
        res.status(options.statusCode).json(options.message);
    },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Protects against brute force attacks
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            url: req.originalUrl,
        });
        res.status(options.statusCode).json(options.message);
    },
});
