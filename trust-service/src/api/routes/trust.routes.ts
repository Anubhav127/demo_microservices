// Trust API routes
import { Router } from 'express';
import { createEvaluationHandler } from '../controllers/trust.controller';
import { getJobStatus } from '../controllers/job.controller';
import { getJobResult } from '../controllers/result.controller';

const router = Router();

// Evaluation endpoints
router.post('/performance', createEvaluationHandler('performance'));
router.post('/fairness', createEvaluationHandler('fairness'));
router.post('/ethics', createEvaluationHandler('ethics'));
router.post('/robustness', createEvaluationHandler('robustness'));

// Job status and result endpoints
router.get('/jobs/:jobId', getJobStatus);
router.get('/jobs/:jobId/result', getJobResult);

export default router;
