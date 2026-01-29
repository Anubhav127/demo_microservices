/**
 * Express Application Setup
 */

import express, { type Request, type Response } from 'express';
import { trustRouter } from './modules/trust/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/trust', trustRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use(errorHandler);

export { app };
