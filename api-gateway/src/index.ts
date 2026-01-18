import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter, projectsRouter, modelsRouter, evaluationsRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(
  {
    origin: "*",
    credentials: true
  }
));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Routes - All proxied to appropriate services
app.use('/auth', authRouter);           // -> Auth Service
app.use('/projects', projectsRouter);   // -> Trust Service
app.use('/models', modelsRouter);       // -> Trust Service
app.use('/evaluations', evaluationsRouter); // -> Trust Service

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('  Auth Service URL:', process.env.AUTH_SERVICE_URL || 'http://localhost:3001');
  console.log('  Trust Service URL:', process.env.TRUST_SERVICE_URL || 'http://localhost:3002');
});

export default app;
