// Zod validation schemas for API requests
import { z } from 'zod';

// UUID validation regex
const uuidSchema = z.string().uuid('Invalid UUID format');

// Evaluation request schema
export const evaluationRequestSchema = z.object({
    model_id: uuidSchema,
    dataset_id: uuidSchema,
    config: z.record(z.unknown()).optional().default({}),
});

export type EvaluationRequestInput = z.infer<typeof evaluationRequestSchema>;

// Job ID parameter schema
export const jobIdSchema = z.object({
    jobId: uuidSchema,
});

export type JobIdInput = z.infer<typeof jobIdSchema>;

// Metric type validation
export const metricTypeSchema = z.enum(['performance', 'fairness', 'ethics', 'robustness']);

export type MetricTypeInput = z.infer<typeof metricTypeSchema>;
