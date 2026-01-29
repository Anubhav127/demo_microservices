/**
 * Trust Routes
 * API endpoints for trust module
 */

import { Router } from 'express';
import * as trustController from './trust.controller.js';

const router = Router();

// POST /api/trust/evaluate - Request evaluation
router.post('/evaluate', trustController.evaluate);

// GET /api/trust/status/:jobId - Get job status
router.get('/status/:jobId', trustController.getStatus);

// GET /api/trust/results/:modelId - Get results for model
router.get('/results/:modelId', trustController.getResults);

// GET /api/trust/jobs/:modelId - Get all jobs for model
router.get('/jobs/:modelId', trustController.getJobs);

export { router as trustRouter };
