import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../lib/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 * Provides consistent error response format
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error details
    logger.error('Error occurred', {
        error: err.message,
        stack: config.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
    });

    // Handle ApiError instances
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }

    // Handle unexpected errors
    res.status(500).json({
        success: false,
        error: config.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message,
    });
};

/**
 * 404 Not Found handler
 * Catches requests that don't match any route
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.debug(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`,
    });
};
