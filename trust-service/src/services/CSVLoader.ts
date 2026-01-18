import fs from 'fs';
import csv from 'csv-parser';

/**
 * Ground truth row interface
 */
export interface GroundTruthRow {
    input: Record<string, unknown>;
    expectedLabel: number;
}

/**
 * CSVLoader class
 * Loads and parses ground truth CSV files
 */
export class CSVLoader {
    /**
     * Load ground truth data from CSV file
     * @param filePath - Path to the CSV file
     * @returns Promise resolving to array of GroundTruthRow
     * @throws Error if file not found or parse error
     */
    async loadGroundTruth(filePath: string): Promise<GroundTruthRow[]> {
        return new Promise((resolve, reject) => {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return reject(new Error(`CSV file not found: ${filePath}`));
            }

            const results: GroundTruthRow[] = [];

            fs.createReadStream(filePath)
                .on('error', (error) => {
                    reject(new Error(`Failed to read CSV file: ${error.message}`));
                })
                .pipe(csv())
                .on('data', (row: Record<string, string>) => {
                    try {
                        // Get expected_label column
                        const expectedLabel = parseInt(row.expected_label, 10);
                        if (isNaN(expectedLabel)) {
                            throw new Error('Invalid expected_label value');
                        }

                        // Build input object from all other columns
                        const input: Record<string, unknown> = {};
                        for (const [key, value] of Object.entries(row)) {
                            if (key !== 'expected_label') {
                                // Try to parse as number, otherwise keep as string
                                const numValue = parseFloat(value);
                                input[key] = isNaN(numValue) ? value : numValue;
                            }
                        }

                        results.push({ input, expectedLabel });
                    } catch (error) {
                        // Skip malformed rows
                        console.warn('Skipping malformed row:', row);
                    }
                })
                .on('end', () => {
                    if (results.length === 0) {
                        reject(new Error('CSV file is empty or contains no valid rows'));
                    } else {
                        resolve(results);
                    }
                })
                .on('error', (error) => {
                    reject(new Error(`CSV parse error: ${error.message}`));
                });
        });
    }
}

// Export singleton instance
export const csvLoader = new CSVLoader();

export default CSVLoader;
