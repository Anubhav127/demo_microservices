// Fairness metric evaluator
import { FairnessMetrics } from '../../types';

interface GroupedData {
    inputs: unknown[];
    ground_truth: unknown[];
    groups: string[];
}

/**
 * Evaluate model fairness metrics
 * Computes: demographic parity, equalized odds, equal opportunity, disparate impact
 */
export async function evaluateFairness(
    predictions: number[],
    dataset: GroupedData,
): Promise<FairnessMetrics> {
    const startTime = Date.now();
    const groundTruth = dataset.ground_truth as number[];

    // Extract demographic groups from inputs
    const inputs = dataset.inputs as Array<{ demographic_group?: string }>;
    const uniqueGroups = [...new Set(inputs.map(i => i.demographic_group || 'unknown'))];

    // Calculate positive prediction rates per group (for demographic parity)
    const groupStats: Record<string, { predictions: number[]; groundTruth: number[] }> = {};

    for (const group of uniqueGroups) {
        groupStats[group] = { predictions: [], groundTruth: [] };
    }

    for (let i = 0; i < predictions.length; i++) {
        const group = inputs[i]?.demographic_group || 'unknown';
        groupStats[group].predictions.push(predictions[i]);
        groupStats[group].groundTruth.push(groundTruth[i]);
    }

    // Calculate positive rate per group
    const positiveRates: Record<string, number> = {};
    for (const [group, stats] of Object.entries(groupStats)) {
        const positives = stats.predictions.filter(p => p === 1).length;
        positiveRates[group] = positives / stats.predictions.length;
    }

    // Demographic Parity: ratio of min/max positive rates across groups
    const rates = Object.values(positiveRates);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const demographicParity = maxRate > 0 ? minRate / maxRate : 1;

    // Calculate TPR and FPR per group for equalized odds
    const groupTPR: Record<string, number> = {};
    const groupFPR: Record<string, number> = {};

    for (const [group, stats] of Object.entries(groupStats)) {
        let tp = 0, fn = 0, fp = 0, tn = 0;
        for (let i = 0; i < stats.predictions.length; i++) {
            if (stats.predictions[i] === 1 && stats.groundTruth[i] === 1) tp++;
            if (stats.predictions[i] === 0 && stats.groundTruth[i] === 1) fn++;
            if (stats.predictions[i] === 1 && stats.groundTruth[i] === 0) fp++;
            if (stats.predictions[i] === 0 && stats.groundTruth[i] === 0) tn++;
        }
        groupTPR[group] = tp + fn > 0 ? tp / (tp + fn) : 0;
        groupFPR[group] = fp + tn > 0 ? fp / (fp + tn) : 0;
    }

    // Equalized Odds: min ratio of TPR and FPR across groups
    const tprValues = Object.values(groupTPR);
    const fprValues = Object.values(groupFPR);
    const tprRatio = Math.max(...tprValues) > 0 ? Math.min(...tprValues) / Math.max(...tprValues) : 1;
    const fprRatio = Math.max(...fprValues) > 0 ? Math.min(...fprValues) / Math.max(...fprValues) : 1;
    const equalizedOdds = Math.min(tprRatio, fprRatio);

    // Equal Opportunity: ratio of min/max TPR
    const equalOpportunity = tprRatio;

    // Disparate Impact: ratio of positive outcome rates
    const disparateImpact = demographicParity;

    const evaluationTimeMs = Date.now() - startTime;

    console.log(`[FairnessEvaluator] Completed evaluation in ${evaluationTimeMs}ms`);
    console.log(`[FairnessEvaluator] Demographic Parity: ${(demographicParity * 100).toFixed(2)}%`);

    return {
        demographic_parity: parseFloat(demographicParity.toFixed(4)),
        equalized_odds: parseFloat(equalizedOdds.toFixed(4)),
        equal_opportunity: parseFloat(equalOpportunity.toFixed(4)),
        disparate_impact: parseFloat(disparateImpact.toFixed(4)),
        evaluated_groups: uniqueGroups,
        evaluation_time_ms: evaluationTimeMs,
    };
}
