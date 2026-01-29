/**
 * Evaluation Service
 * Shared job management for all evaluation modules
 */

import { randomUUID } from 'crypto';
import type {
    CreateJobParams,
    CreateJobResponse,
    EvaluationJob,
    EvaluationResult,
    JobStatus,
    JobStatusResponse,
    ModuleType,
} from './evaluation.types.js';
import * as repository from './evaluation.repository.js';
import { evaluationQueue } from '../../queue/index.js';

/**
 * Create a new evaluation job
 * - Checks for existing pending/processing job
 * - Creates DB record
 * - Enqueues to BullMQ
 */
export async function createJob(
    params: CreateJobParams
): Promise<CreateJobResponse> {
    const { modelId, userId, moduleType, metricType } = params;

    // Check for existing job
    const existingJob = repository.findExistingJob(
        modelId,
        userId,
        moduleType,
        metricType
    );

    if (existingJob) {
        return {
            jobId: existingJob.id,
            status: existingJob.status,
            message: `Evaluation job already ${existingJob.status}`,
        };
    }

    // Create new job
    const jobId = randomUUID();
    const now = new Date();

    const job: EvaluationJob = {
        id: jobId,
        modelId,
        userId,
        moduleType,
        metricType,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    };

    repository.createJob(job);

    // Enqueue to BullMQ
    await evaluationQueue.add('evaluation', {
        jobId,
        modelId,
        userId,
        moduleType,
        metricType,
    });

    return {
        jobId,
        status: 'pending',
        message: 'Evaluation job created and queued',
    };
}

/**
 * Get job status by ID
 */
export function getJobStatus(jobId: string): JobStatusResponse | null {
    const job = repository.findJobById(jobId);

    if (!job) {
        return null;
    }

    return {
        jobId: job.id,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        error: job.error,
    };
}

/**
 * Get all jobs for a model
 */
export function getJobsByModel(modelId: string, userId: string) {
    return repository.findJobsByModel(modelId, userId);
}

/**
 * Update job status
 */
export function updateJobStatus(
    jobId: string,
    status: JobStatus,
    error?: string
) {
    return repository.updateJobStatus(jobId, status, error);
}

/**
 * Store evaluation result
 */
export function storeResult(result: EvaluationResult) {
    return repository.storeResult(result);
}

/**
 * Get results for a model
 */
export function getResults(modelId: string, moduleType: ModuleType) {
    return repository.getResultsByModel(modelId, moduleType);
}
