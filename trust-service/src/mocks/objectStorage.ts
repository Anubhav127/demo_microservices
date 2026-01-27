// Mock Object Storage client for datasets
import { DatasetMetadata, DatasetData } from '../types';

// Mock dataset database
const mockDatasets: Record<string, DatasetMetadata> = {
    '660e8400-e29b-41d4-a716-446655440001': {
        id: '660e8400-e29b-41d4-a716-446655440001',
        name: 'sentiment-test-dataset',
        size: 1000,
        format: 'json',
    },
    '660e8400-e29b-41d4-a716-446655440002': {
        id: '660e8400-e29b-41d4-a716-446655440002',
        name: 'fraud-validation-dataset',
        size: 5000,
        format: 'json',
    },
};

/**
 * Verify that a dataset exists in object storage
 * In production, this would check S3/MinIO for the dataset
 */
export async function verifyDataset(datasetId: string): Promise<DatasetMetadata | null> {
    console.log(`[ObjectStorage] Verifying dataset ${datasetId}`);

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50));

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (mockDatasets[datasetId]) {
        return mockDatasets[datasetId];
    }

    // Return generated mock for any valid UUID
    if (uuidRegex.test(datasetId)) {
        return {
            id: datasetId,
            name: `mock-dataset-${datasetId.substring(0, 8)}`,
            size: 500,
            format: 'json',
        };
    }

    return null;
}

/**
 * Load dataset from object storage
 * In production, this would download and parse the dataset from S3/MinIO
 */
export async function loadDataset(datasetId: string): Promise<DatasetData> {
    console.log(`[ObjectStorage] Loading dataset ${datasetId}`);

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 150));

    const metadata = await verifyDataset(datasetId);

    if (!metadata) {
        throw new Error(`Dataset ${datasetId} not found`);
    }

    // Generate mock dataset with binary classification data
    const size = metadata.size || 500;
    const inputs: Record<string, unknown>[] = [];
    const ground_truth: number[] = [];

    // Generate deterministic but varied test data
    for (let i = 0; i < size; i++) {
        inputs.push({
            id: i,
            features: [
                Math.sin(i * 0.1) * 100,
                Math.cos(i * 0.1) * 100,
                (i % 50) / 50,
            ],
            text: `Sample input ${i}`,
        });

        // Ground truth: deterministic pattern
        ground_truth.push((i * 13 + datasetId.charCodeAt(0)) % 2);
    }

    return {
        inputs,
        ground_truth,
        metadata,
    };
}

/**
 * Get demographic groups for fairness evaluation
 */
export async function loadDatasetWithGroups(datasetId: string): Promise<DatasetData & { groups: string[] }> {
    const baseData = await loadDataset(datasetId);

    // Add demographic groups for fairness evaluation
    const groups = ['group_a', 'group_b', 'group_c'];

    return {
        ...baseData,
        groups,
        inputs: baseData.inputs.map((input, i) => ({
            ...(input as Record<string, unknown>),
            demographic_group: groups[i % groups.length],
        })),
    };
}
