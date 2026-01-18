/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
    truePositives: number;
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
}

/**
 * MetricsCalculator class
 * Computes performance metrics from predictions and actual labels
 */
export class MetricsCalculator {
    /**
     * Compute all performance metrics
     * @param predictions - Array of predicted labels (0 or 1)
     * @param actuals - Array of actual/ground truth labels (0 or 1)
     * @returns PerformanceMetrics object with all computed values
     */
    compute(predictions: number[], actuals: number[]): PerformanceMetrics {
        if (predictions.length !== actuals.length) {
            throw new Error('Predictions and actuals arrays must have the same length');
        }

        if (predictions.length === 0) {
            throw new Error('Cannot compute metrics on empty arrays');
        }

        // Calculate confusion matrix values
        let truePositives = 0;
        let trueNegatives = 0;
        let falsePositives = 0;
        let falseNegatives = 0;

        for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const actual = actuals[i];

            if (pred === 1 && actual === 1) {
                truePositives++;
            } else if (pred === 0 && actual === 0) {
                trueNegatives++;
            } else if (pred === 1 && actual === 0) {
                falsePositives++;
            } else if (pred === 0 && actual === 1) {
                falseNegatives++;
            }
        }

        const total = truePositives + trueNegatives + falsePositives + falseNegatives;

        // Calculate Accuracy: (TP + TN) / total
        const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;

        // Calculate Precision: TP / (TP + FP)
        const precisionDenom = truePositives + falsePositives;
        const precision = precisionDenom > 0 ? truePositives / precisionDenom : 0;

        // Calculate Recall: TP / (TP + FN)
        const recallDenom = truePositives + falseNegatives;
        const recall = recallDenom > 0 ? truePositives / recallDenom : 0;

        // Calculate F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
        const f1Denom = precision + recall;
        const f1Score = f1Denom > 0 ? 2 * (precision * recall) / f1Denom : 0;

        return {
            truePositives,
            trueNegatives,
            falsePositives,
            falseNegatives,
            accuracy,
            precision,
            recall,
            f1Score,
        };
    }
}

// Export singleton instance
export const metricsCalculator = new MetricsCalculator();

export default MetricsCalculator;
