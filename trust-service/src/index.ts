import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, syncDatabase } from './config/database';
import { initializeConsumer, initializeProducer } from './kafka';
import { initializeAssociations } from './models';
import { minioService } from './services';
import { projectsRouter, modelsRouter, evaluationsRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'trust-service' });
});

// Mount routes
app.use('/projects', projectsRouter);
app.use('/models', modelsRouter);
app.use('/evaluations', evaluationsRouter);

// Initialize database, Kafka, MinIO, and start server
const startServer = async () => {
  try {
    // Initialize model associations
    initializeAssociations();

    // Sync database (creates tables if they don't exist)
    await syncDatabase({ alter: true });
    console.log('✓ Database synchronized');

    // Initialize MinIO
    try {
      await minioService.initialize();
    } catch (minioError) {
      console.warn('⚠ MinIO connection failed:', minioError);
    }

    // Initialize Kafka producer
    try {
      await initializeProducer();
    } catch (kafkaError) {
      console.warn('⚠ Kafka producer connection failed:', kafkaError);
    }

    // Initialize Kafka consumer
    try {
      await initializeConsumer();
    } catch (kafkaError) {
      console.warn('⚠ Kafka consumer connection failed:', kafkaError);
    }

    app.listen(PORT, () => {
      console.log(`Trust Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
