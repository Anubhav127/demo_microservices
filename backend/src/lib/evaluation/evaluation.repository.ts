/**
 * Evaluation Repository
 * In-memory storage for MVP - replace with database later
 */

import type {
    EvaluationJob,
    EvaluationResult,
    JobStatus,
    ModuleType,
    MetricType,
} from './evaluation.types.js';

// In-memory stores (replace with database)
const jobs = new Map<string, EvaluationJob>();
const results = new Map<string, EvaluationResult[]>();

/**
 * Create a new evaluation job
 */
export function createJob(job: EvaluationJob): EvaluationJob {
    jobs.set(job.id, job);
    return job;
}

/**
 * Find job by ID
 */
export function findJobById(jobId: string): EvaluationJob | undefined {
    return jobs.get(jobId);
}

/**
 * Find existing pending/processing job for same model, user, module, metric
 */
export function findExistingJob(
    modelId: string,
    userId: string,
    moduleType: ModuleType,
    metricType: MetricType
): EvaluationJob | undefined {
    for (const job of jobs.values()) {
        if (
            job.modelId === modelId &&
            job.userId === userId &&
            job.moduleType === moduleType &&
            job.metricType === metricType &&
            (job.status === 'pending' || job.status === 'processing')
        ) {
            return job;
        }
    }
    return undefined;
}

/**
 * Find all jobs for a model
 */
export function findJobsByModel(
    modelId: string,
    userId: string
): EvaluationJob[] {
    const modelJobs: EvaluationJob[] = [];
    for (const job of jobs.values()) {
        if (job.modelId === modelId && job.userId === userId) {
            modelJobs.push(job);
        }
    }
    return modelJobs;
}

/**
 * Update job status
 */
export function updateJobStatus(
    jobId: string,
    status: JobStatus,
    error?: string
): EvaluationJob | undefined {
    const job = jobs.get(jobId);
    if (!job) return undefined;

    job.status = status;
    job.updatedAt = new Date();

    if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
    }

    if (error) {
        job.error = error;
    }

    jobs.set(jobId, job);
    return job;
}

/**
 * Store evaluation result
 */
export function storeResult(result: EvaluationResult): EvaluationResult {
    const key = `${result.modelId}:${result.moduleType}`;
    const existing = results.get(key) || [];
    existing.push(result);
    results.set(key, existing);
    return result;
}

/**
 * Get results for a model and module type
 */
export function getResultsByModel(
    modelId: string,
    moduleType: ModuleType
): EvaluationResult[] {
    const key = `${modelId}:${moduleType}`;
    return results.get(key) || [];
}

/**
 * Get latest result for a specific metric
 */
export function getLatestResult(
    modelId: string,
    moduleType: ModuleType,
    metricType: MetricType
): EvaluationResult | undefined {
    const allResults = getResultsByModel(modelId, moduleType);
    const filtered = allResults.filter((r) => r.metricType === metricType);
    return filtered.sort(
        (a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime()
    )[0];
}
