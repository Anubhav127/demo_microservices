// Type definitions for Trust Microservice

export type MetricType = 'performance' | 'fairness' | 'ethics' | 'robustness';

export type JobStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobPayload {
    job_id: string;
    model_id: string;
    metric_type: MetricType;
    dataset_id: string;
    config: Record<string, unknown>;
    requested_by: {
        user_id: string;
        source: 'api' | 'system';
    };
    created_at: string;
}

export interface EvaluationRequest {
    model_id: string;
    dataset_id: string;
    config?: Record<string, unknown>;
}

export interface ModelMetadata {
    id: string;
    name: string;
    version: string;
    type: string;
    created_at: string;
}

export interface DatasetMetadata {
    id: string;
    name: string;
    size: number;
    format: string;
}

export interface DatasetData {
    inputs: unknown[];
    ground_truth: unknown[];
    metadata: DatasetMetadata;
}

export interface PerformanceMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: {
        true_positives: number;
        true_negatives: number;
        false_positives: number;
        false_negatives: number;
    };
    evaluated_samples: number;
    evaluation_time_ms: number;
}

export interface FairnessMetrics {
    demographic_parity: number;
    equalized_odds: number;
    equal_opportunity: number;
    disparate_impact: number;
    evaluated_groups: string[];
    evaluation_time_ms: number;
}

export interface EthicsMetrics {
    bias_score: number;
    transparency_score: number;
    explainability_score: number;
    privacy_compliance: boolean;
    evaluation_time_ms: number;
}

export interface RobustnessMetrics {
    adversarial_accuracy: number;
    noise_tolerance: number;
    perturbation_sensitivity: number;
    stability_score: number;
    evaluation_time_ms: number;
}

export type EvaluationMetrics =
    | PerformanceMetrics
    | FairnessMetrics
    | EthicsMetrics
    | RobustnessMetrics;
