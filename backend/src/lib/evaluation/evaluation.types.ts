/**
 * Evaluation Module Types
 * Shared interfaces for the evaluation workflow
 */

// Supported module types (trust + future modules)
export type ModuleType = 'trust' | 'safety' | 'reliability' | 'compliance';

// Supported metric types across all modules
export type MetricType = 'performance' | 'fairness' | 'explainability' | 'ethical';

// Job status lifecycle
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Evaluation job record
export interface EvaluationJob {
    id: string;
    modelId: string;
    userId: string;
    moduleType: ModuleType;
    metricType: MetricType;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    error?: string;
}

// Parameters for creating a new job
export interface CreateJobParams {
    modelId: string;
    userId: string;
    moduleType: ModuleType;
    metricType: MetricType;
}

// Generic evaluation result structure
export interface EvaluationResult {
    jobId: string;
    modelId: string;
    userId: string;
    moduleType: ModuleType;
    metricType: MetricType;
    score: number;
    details: Record<string, unknown>;
    evaluatedAt: Date;
}

// Job data passed to BullMQ queue
export interface EvaluationJobData {
    jobId: string;
    modelId: string;
    userId: string;
    moduleType: ModuleType;
    metricType: MetricType;
}

// Response types for API
export interface CreateJobResponse {
    jobId: string;
    status: JobStatus;
    message: string;
}

export interface JobStatusResponse {
    jobId: string;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date | undefined;
    error?: string | undefined;
}
