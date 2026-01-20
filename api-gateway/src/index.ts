import dotenv from 'dotenv';

// Load environment variables BEFORE importing config
dotenv.config();

// Import config to trigger validation (fail-fast)
import './config';
import { startServer } from './server';
import { logger } from './lib/logger';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason });
  process.exit(1);
});

// Start the application
startServer();
