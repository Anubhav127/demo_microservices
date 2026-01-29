/**
 * Trust Service
 * Domain-specific logic for trust module
 */

import * as evaluationService from '../../lib/evaluation/evaluation.service.js';
import type {
    CreateJobResponse,
    MetricType,
    EvaluationResult,
} from '../../lib/evaluation/index.js';

// Mock model ownership data (replace with actual model_registry integration)
const modelOwnership = new Map<string, string>([
    ['model-123', 'user-456'],
    ['model-abc', 'user-456'],
    ['model-xyz', 'user-789'],
]);

export interface EvaluateParams {
    modelId: string;
    userId: string;
    metricType: MetricType;
}

/**
 * Validate model ownership
 */
export function validateModelOwnership(
    modelId: string,
    userId: string
): boolean {
    const owner = modelOwnership.get(modelId);
    // If model doesn't exist in our mock, assume ownership is valid for demo
    if (!owner) return true;
    return owner === userId;
}

/**
 * Request a trust evaluation
 */
export async function requestEvaluation(
    params: EvaluateParams
): Promise<CreateJobResponse> {
    const { modelId, userId, metricType } = params;

    // Validate model ownership
    if (!validateModelOwnership(modelId, userId)) {
        throw new Error('Model not found or access denied');
    }

    // Create job via shared evaluation service
    return evaluationService.createJob({
        modelId,
        userId,
        moduleType: 'trust',
        metricType,
    });
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string) {
    return evaluationService.getJobStatus(jobId);
}

/**
 * Get results for a model
 */
export function getResults(modelId: string): EvaluationResult[] {
    return evaluationService.getResults(modelId, 'trust');
}

/**
 * Get all jobs for a model
 */
export function getJobsForModel(modelId: string, userId: string) {
    return evaluationService.getJobsByModel(modelId, userId);
}
