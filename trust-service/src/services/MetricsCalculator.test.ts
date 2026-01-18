import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MetricsCalculator } from './MetricsCalculator';

describe('MetricsCalculator', () => {
    const calculator = new MetricsCalculator();

    describe('Unit Tests', () => {
        it('should compute metrics for all correct predictions', () => {
            const predictions = [1, 1, 0, 0];
            const actuals = [1, 1, 0, 0];

            const metrics = calculator.compute(predictions, actuals);

            expect(metrics.truePositives).toBe(2);
            expect(metrics.trueNegatives).toBe(2);
            expect(metrics.falsePositives).toBe(0);
            expect(metrics.falseNegatives).toBe(0);
            expect(metrics.accuracy).toBe(1);
            expect(metrics.precision).toBe(1);
            expect(metrics.recall).toBe(1);
            expect(metrics.f1Score).toBe(1);
        });

        it('should compute metrics for all incorrect predictions', () => {
            const predictions = [1, 1, 0, 0];
            const actuals = [0, 0, 1, 1];

            const metrics = calculator.compute(predictions, actuals);

            expect(metrics.truePositives).toBe(0);
            expect(metrics.trueNegatives).toBe(0);
            expect(metrics.falsePositives).toBe(2);
            expect(metrics.falseNegatives).toBe(2);
            expect(metrics.accuracy).toBe(0);
            expect(metrics.precision).toBe(0);
            expect(metrics.recall).toBe(0);
            expect(metrics.f1Score).toBe(0);
        });

        it('should compute metrics for mixed predictions', () => {
            const predictions = [1, 0, 1, 0];
            const actuals = [1, 1, 0, 0];

            const metrics = calculator.compute(predictions, actuals);

            expect(metrics.truePositives).toBe(1);
            expect(metrics.trueNegatives).toBe(1);
            expect(metrics.falsePositives).toBe(1);
            expect(metrics.falseNegatives).toBe(1);
            expect(metrics.accuracy).toBe(0.5);
            expect(metrics.precision).toBe(0.5);
            expect(metrics.recall).toBe(0.5);
            expect(metrics.f1Score).toBe(0.5);
        });

        it('should handle division by zero in precision', () => {
            const predictions = [0, 0, 0, 0]; // No positive predictions
            const actuals = [1, 1, 0, 0];

            const metrics = calculator.compute(predictions, actuals);

            expect(metrics.precision).toBe(0);
        });

        it('should handle division by zero in recall', () => {
            const predictions = [0, 0, 1, 1];
            const actuals = [0, 0, 0, 0]; // No actual positives

            const metrics = calculator.compute(predictions, actuals);

            expect(metrics.recall).toBe(0);
        });

        it('should throw on empty arrays', () => {
            expect(() => calculator.compute([], [])).toThrow();
        });

        it('should throw on mismatched array lengths', () => {
            expect(() => calculator.compute([1, 0], [1])).toThrow();
        });
    });

    describe('Property-Based Tests', () => {
        it('Feature: ai-model-evaluation-platform, Property 8: Metrics Computation Correctness', async () => {
            const predictionArb = fc.integer({ min: 0, max: 1 });
            const predictionsArrayArb = fc.array(predictionArb, { minLength: 1, maxLength: 100 });

            await fc.assert(
                fc.asyncProperty(
                    predictionsArrayArb,
                    predictionsArrayArb.filter(arr => arr.length > 0),
                    async (predictions, actuals) => {
                        // Ensure same length
                        const len = Math.min(predictions.length, actuals.length);
                        const preds = predictions.slice(0, len);
                        const acts = actuals.slice(0, len);

                        if (len === 0) return;

                        const metrics = calculator.compute(preds, acts);
                        const { truePositives, trueNegatives, falsePositives, falseNegatives } = metrics;
                        const total = len;

                        // Property 8a: TP + TN + FP + FN SHALL equal total samples
                        expect(truePositives + trueNegatives + falsePositives + falseNegatives).toBe(total);

                        // Property 8b: Accuracy SHALL equal (TP + TN) / total
                        const expectedAccuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;
                        expect(metrics.accuracy).toBeCloseTo(expectedAccuracy, 10);

                        // Property 8c: Precision SHALL equal TP / (TP + FP) when (TP + FP) > 0, else 0
                        const precDenom = truePositives + falsePositives;
                        const expectedPrecision = precDenom > 0 ? truePositives / precDenom : 0;
                        expect(metrics.precision).toBeCloseTo(expectedPrecision, 10);

                        // Property 8d: Recall SHALL equal TP / (TP + FN) when (TP + FN) > 0, else 0
                        const recallDenom = truePositives + falseNegatives;
                        const expectedRecall = recallDenom > 0 ? truePositives / recallDenom : 0;
                        expect(metrics.recall).toBeCloseTo(expectedRecall, 10);

                        // Property 8e: F1 Score SHALL equal 2 * (P * R) / (P + R) when (P + R) > 0, else 0
                        const f1Denom = expectedPrecision + expectedRecall;
                        const expectedF1 = f1Denom > 0 ? 2 * (expectedPrecision * expectedRecall) / f1Denom : 0;
                        expect(metrics.f1Score).toBeCloseTo(expectedF1, 10);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
