import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './lib/logger';
import { requestLogger } from './middlewares/request.middleware';
import { rateLimiter } from './middlewares/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';

/**
 * Create and configure Express application
 */
export const createApp = () => {
    const app = express();

    // Security headers
    app.use(helmet());

    // CORS configuration
    app.use(cors({
        origin: config.NODE_ENV === 'production'
            ? process.env.ALLOWED_ORIGINS?.split(',') || []
            : '*',
        credentials: true,
    }));

    // Rate limiting
    app.use(rateLimiter);

    // Request logging
    app.use(requestLogger);

    // Health check endpoint (before auth)
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            service: 'api-gateway',
            timestamp: new Date().toISOString(),
        });
    });

    // Mount API routes (proxy routes - no body parsing needed)
    // IMPORTANT: Do NOT add express.json() before proxy routes
    // http-proxy-middleware needs the raw body stream
    app.use(routes);

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
};

/**
 * Start the server
 */
export const startServer = () => {
    const app = createApp();

    app.listen(config.PORT, () => {
        logger.info(`🚀 API Gateway running on port ${config.PORT}`);
        logger.info(`   Environment: ${config.NODE_ENV}`);
        logger.info(`   Auth Service: ${config.AUTH_SERVICE_URL}`);
    });

    return app;
};
