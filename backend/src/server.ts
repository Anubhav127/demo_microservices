/**
 * Server Entry Point
 */

import { app } from './app.js';
import { startWorker, stopWorker } from './worker/index.js';
import { evaluationQueue } from './queue/index.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
    try {
        console.log('🚀 Starting server...');

        // Start the evaluation worker
        await startWorker();

        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/health`);
            console.log(`🔧 Trust API: http://localhost:${PORT}/api/trust`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                console.log('HTTP server closed');

                await stopWorker();
                await evaluationQueue.close();

                console.log('Cleanup complete. Exiting.');
                process.exit(0);
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main();
