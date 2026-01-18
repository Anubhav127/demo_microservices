import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, syncDatabase } from './config/database';
import { authRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Mount auth routes
app.use('/auth', authRouter);

// Initialize database and start server
const startServer = async () => {
  try {
    // Sync database (creates tables if they don't exist)
    await syncDatabase({ alter: true });
    console.log('✓ Database synchronized');

    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
