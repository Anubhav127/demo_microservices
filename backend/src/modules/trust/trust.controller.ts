/**
 * Trust Controller
 * HTTP request handlers for trust module
 */

import type { Request, Response, NextFunction } from 'express';
import * as trustService from './trust.service.js';
import type { MetricType } from '../../lib/evaluation/index.js';

const VALID_METRIC_TYPES: MetricType[] = [
    'performance',
    'fairness',
    'explainability',
    'ethical',
];

/**
 * POST /api/trust/evaluate
 * Request a trust evaluation for a model
 */
export async function evaluate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { modelId, userId, metricType } = req.body;

        // Validate required fields
        if (!modelId || !userId || !metricType) {
            res.status(400).json({
                error: 'Missing required fields: modelId, userId, metricType',
            });
            return;
        }

        // Validate metric type
        if (!VALID_METRIC_TYPES.includes(metricType)) {
            res.status(400).json({
                error: `Invalid metricType. Must be one of: ${VALID_METRIC_TYPES.join(', ')}`,
            });
            return;
        }

        const result = await trustService.requestEvaluation({
            modelId,
            userId,
            metricType,
        });

        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error && error.message.includes('access denied')) {
            res.status(403).json({ error: error.message });
            return;
        }
        next(error);
    }
}

/**
 * GET /api/trust/status/:jobId
 * Get status of an evaluation job
 */
export async function getStatus(
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> {
    const { jobId } = req.params;

    if (!jobId) {
        res.status(400).json({ error: 'Missing jobId parameter' });
        return;
    }

    const status = trustService.getJobStatus(jobId as string);

    if (!status) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    res.json(status);
}

/**
 * GET /api/trust/results/:modelId
 * Get evaluation results for a model
 */
export async function getResults(
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> {
    const { modelId } = req.params;

    if (!modelId) {
        res.status(400).json({ error: 'Missing modelId parameter' });
        return;
    }

    const results = trustService.getResults(modelId as string);

    res.json({
        modelId,
        results,
        count: results.length,
    });
}

/**
 * GET /api/trust/jobs/:modelId
 * Get all jobs for a model
 */
export async function getJobs(
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> {
    const { modelId } = req.params;
    const userId = req.query.userId as string;

    if (!modelId || !userId) {
        res.status(400).json({ error: 'Missing modelId or userId' });
        return;
    }

    const jobs = trustService.getJobsForModel(modelId as string, userId);

    res.json({
        modelId,
        jobs,
        count: jobs.length,
    });
}
