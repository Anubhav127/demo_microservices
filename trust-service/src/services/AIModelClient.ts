import axios, { AxiosError } from 'axios';

/**
 * AI Response interface
 */
export interface AIResponse {
    prediction: number;
    confidence: string;
}

/**
 * AIModelClient class
 * Calls external AI model endpoints for predictions
 */
export class AIModelClient {
    private readonly timeout: number;

    constructor(timeout: number = 30000) {
        this.timeout = timeout;
    }

    /**
     * Call AI model endpoint for prediction
     * @param endpointUrl - URL of the AI model's prediction endpoint
     * @param input - Input data for prediction
     * @returns Promise resolving to AIResponse
     * @throws Error on network errors, timeouts, or invalid responses
     */
    async predict(endpointUrl: string, input: Record<string, unknown>): Promise<AIResponse> {
        try {
            const response = await axios.post(
                endpointUrl,
                { input },
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Validate response status
            if (response.status !== 200) {
                throw new Error(`AI service returned status ${response.status}`);
            }

            // Validate response structure
            const data = response.data;
            if (typeof data.prediction === 'undefined') {
                throw new Error('AI response missing prediction field');
            }
            if (typeof data.confidence === 'undefined') {
                throw new Error('AI response missing confidence field');
            }

            return {
                prediction: data.prediction,
                confidence: data.confidence,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error(`AI service timeout after ${this.timeout}ms`);
                }
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('AI service unreachable');
                }
                if (error.response) {
                    throw new Error(`AI service error: ${error.response.status} ${error.response.statusText}`);
                }
                throw new Error(`AI service network error: ${error.message}`);
            }
            throw error;
        }
    }
}

// Export singleton instance
export const aiModelClient = new AIModelClient();

export default AIModelClient;
