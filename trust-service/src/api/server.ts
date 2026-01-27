// Express API server entry point
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from '../config';
import { initializeDatabase } from '../db/config';
import trustRoutes from './routes/trust.routes';
import { getQueueStats } from '../queue/producer';

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
    try {
        const queueStats = await getQueueStats();
        res.status(200).json({
            status: 'healthy',
            service: 'trust-service-api',
            timestamp: new Date().toISOString(),
            queue: queueStats,
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Trust evaluation routes
app.use('/trust', trustRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API] Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// Start server
async function start(): Promise<void> {
    try {
        // Initialize database connection
        await initializeDatabase();
        console.log('[API] Database connection established');

        // Start listening
        app.listen(config.port, () => {
            console.log(`[API] Trust Service API running on port ${config.port}`);
        });
    } catch (error) {
        console.error('[API] Failed to start server:', error);
        process.exit(1);
    }
}

start();

export { app };
