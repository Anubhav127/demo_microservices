// Mock Model Registry client
import { ModelMetadata } from '../types';

// Mock model database
const mockModels: Record<string, ModelMetadata> = {
    // Pre-populated mock models for testing
    '550e8400-e29b-41d4-a716-446655440001': {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'sentiment-classifier-v1',
        version: '1.0.0',
        type: 'classification',
        created_at: '2024-01-15T10:00:00Z',
    },
    '550e8400-e29b-41d4-a716-446655440002': {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'fraud-detector-v2',
        version: '2.1.0',
        type: 'binary-classification',
        created_at: '2024-02-20T14:30:00Z',
    },
};

/**
 * Verify that a model exists in the registry
 * In production, this would call the Model Registry Service API
 */
export async function verifyModel(modelId: string): Promise<ModelMetadata | null> {
    console.log(`[ModelRegistry] Verifying model ${modelId}`);

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50));

    // For mock purposes, accept any valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (mockModels[modelId]) {
        return mockModels[modelId];
    }

    // Return a generated mock for any valid UUID
    if (uuidRegex.test(modelId)) {
        return {
            id: modelId,
            name: `mock-model-${modelId.substring(0, 8)}`,
            version: '1.0.0',
            type: 'classification',
            created_at: new Date().toISOString(),
        };
    }

    return null;
}

/**
 * Get model artifact (inference function)
 * In production, this would download from Object Storage and load the model
 */
export async function getModelArtifact(modelId: string): Promise<{
    predict: (inputs: unknown[]) => number[];
}> {
    console.log(`[ModelRegistry] Loading model artifact for ${modelId}`);

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return a mock inference function (simple binary classifier)
    return {
        predict: (inputs: unknown[]): number[] => {
            // Mock prediction: returns 0 or 1 based on input hash
            return inputs.map((_, index) => {
                // Deterministic but varied output based on index
                return (index * 7 + modelId.charCodeAt(0)) % 2;
            });
        },
    };
}
