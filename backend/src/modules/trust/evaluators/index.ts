/**
 * Trust Evaluators Registry
 * Maps metric types to their evaluator functions
 */

import { evaluatePerformance } from './performance.js';
import { evaluateFairness } from './fairness.js';
import { evaluateExplainability } from './explainability.js';
import { evaluateEthical } from './ethical.js';
import type { MetricType } from '../../../lib/evaluation/index.js';

// Evaluator function signature
export type EvaluatorFunction = (
    modelId: string,
    userId: string
) => Promise<{ score: number; details: Record<string, unknown> }>;

// Registry of evaluators by metric type
export const trustEvaluators: Record<MetricType, EvaluatorFunction> = {
    performance: evaluatePerformance,
    fairness: evaluateFairness,
    explainability: evaluateExplainability,
    ethical: evaluateEthical,
};

// Re-export individual evaluators
export { evaluatePerformance } from './performance.js';
export { evaluateFairness } from './fairness.js';
export { evaluateExplainability } from './explainability.js';
export { evaluateEthical } from './ethical.js';
