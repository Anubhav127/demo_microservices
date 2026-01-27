// Performance metric evaluator
import { PerformanceMetrics, DatasetData } from '../../types';

/**
 * Evaluate model performance metrics
 * Computes: accuracy, precision, recall, F1 score, confusion matrix
 */
export async function evaluatePerformance(
    predictions: number[],
    dataset: DatasetData,
): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const groundTruth = dataset.ground_truth as number[];

    if (predictions.length !== groundTruth.length) {
        throw new Error(`Prediction count (${predictions.length}) does not match ground truth (${groundTruth.length})`);
    }

    // Calculate confusion matrix
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < predictions.length; i++) {
        const predicted = predictions[i];
        const actual = groundTruth[i];

        if (predicted === 1 && actual === 1) {
            truePositives++;
        } else if (predicted === 0 && actual === 0) {
            trueNegatives++;
        } else if (predicted === 1 && actual === 0) {
            falsePositives++;
        } else if (predicted === 0 && actual === 1) {
            falseNegatives++;
        }
    }

    // Calculate metrics
    const total = predictions.length;
    const accuracy = (truePositives + trueNegatives) / total;

    const precision = truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;

    const recall = truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0;

    const f1Score = precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    const evaluationTimeMs = Date.now() - startTime;

    console.log(`[PerformanceEvaluator] Completed evaluation in ${evaluationTimeMs}ms`);
    console.log(`[PerformanceEvaluator] Accuracy: ${(accuracy * 100).toFixed(2)}%, F1: ${(f1Score * 100).toFixed(2)}%`);

    return {
        accuracy: parseFloat(accuracy.toFixed(4)),
        precision: parseFloat(precision.toFixed(4)),
        recall: parseFloat(recall.toFixed(4)),
        f1_score: parseFloat(f1Score.toFixed(4)),
        confusion_matrix: {
            true_positives: truePositives,
            true_negatives: trueNegatives,
            false_positives: falsePositives,
            false_negatives: falseNegatives,
        },
        evaluated_samples: total,
        evaluation_time_ms: evaluationTimeMs,
    };
}
