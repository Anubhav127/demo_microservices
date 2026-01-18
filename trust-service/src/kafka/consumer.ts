import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { processEvaluationJob, EvaluationJobMessage } from '../services';

/**
 * Kafka configuration
 */
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'trust-service-group';
const KAFKA_TOPIC = 'model-evaluation-jobs';

/**
 * Kafka client instance
 */
const kafka = new Kafka({
    clientId: 'trust-service',
    brokers: [KAFKA_BROKER],
    retry: {
        initialRetryTime: 100,
        retries: 5,
    },
});

/**
 * Kafka consumer instance
 */
let consumer: Consumer | null = null;

/**
 * Handle incoming evaluation job message
 */
const handleMessage = async ({ message }: EachMessagePayload): Promise<void> => {
    if (!message.value) {
        console.warn('Received empty message');
        return;
    }

    try {
        const job: EvaluationJobMessage = JSON.parse(message.value.toString());
        console.log(`Received evaluation job: ${job.evaluationId}`);

        await processEvaluationJob(job);
    } catch (error) {
        console.error('Failed to process message:', error);
    }
};

/**
 * Initialize Kafka consumer
 */
export const initializeConsumer = async (): Promise<void> => {
    try {
        consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });
        await consumer.connect();
        console.log('✓ Kafka consumer connected');

        await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
        console.log(`✓ Subscribed to topic: ${KAFKA_TOPIC}`);

        await consumer.run({
            eachMessage: handleMessage,
        });
        console.log('✓ Kafka consumer running');
    } catch (error) {
        console.error('✗ Failed to initialize Kafka consumer:', error);
        throw error;
    }
};

/**
 * Disconnect Kafka consumer
 */
export const disconnectConsumer = async (): Promise<void> => {
    if (consumer) {
        await consumer.disconnect();
        consumer = null;
        console.log('✓ Kafka consumer disconnected');
    }
};

export default {
    initializeConsumer,
    disconnectConsumer,
};
