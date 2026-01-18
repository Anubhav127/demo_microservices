import { Kafka, Producer, logLevel } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'trust-service-producer',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
    logLevel: logLevel.WARN,
});

let producer: Producer | null = null;

export interface EvaluationJobPayload {
    evaluationId: string;
    userId: string;
    projectId: string;
    modelId: string;
    fileKey: string | null;
}

/**
 * Initialize Kafka producer
 */
export const initializeProducer = async (): Promise<void> => {
    producer = kafka.producer();
    await producer.connect();
    console.log('✓ Kafka producer connected');
};

/**
 * Send evaluation job to Kafka
 */
export const sendEvaluationJob = async (payload: EvaluationJobPayload): Promise<void> => {
    if (!producer) {
        await initializeProducer();
    }

    await producer!.send({
        topic: 'model-evaluation-jobs',
        messages: [
            {
                key: payload.evaluationId,
                value: JSON.stringify(payload),
            },
        ],
    });

    console.log(`✓ Evaluation job sent: ${payload.evaluationId}`);
};

/**
 * Disconnect producer
 */
export const disconnectProducer = async (): Promise<void> => {
    if (producer) {
        await producer.disconnect();
        producer = null;
    }
};

export default { initializeProducer, sendEvaluationJob, disconnectProducer };
