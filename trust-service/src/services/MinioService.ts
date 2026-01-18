import { Client as MinioClient } from 'minio';
import { Readable } from 'stream';

/**
 * MinIO/S3 Service for object storage operations
 */
export class MinioService {
    private client: MinioClient;
    private bucket: string;
    private initialized: boolean = false;

    constructor() {
        this.client = new MinioClient({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000', 10),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        });
        this.bucket = process.env.MINIO_BUCKET || 'evaluations';
    }

    /**
     * Initialize bucket if it doesn't exist
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const exists = await this.client.bucketExists(this.bucket);
            if (!exists) {
                await this.client.makeBucket(this.bucket);
                console.log(`✓ Created MinIO bucket: ${this.bucket}`);
            }
            this.initialized = true;
            console.log('✓ MinIO service initialized');
        } catch (error) {
            console.error('✗ Failed to initialize MinIO:', error);
            throw error;
        }
    }

    /**
     * Upload CSV file to MinIO
     * @param key - Object key (file path in bucket)
     * @param data - File buffer
     * @returns Object key
     */
    async uploadCSV(key: string, data: Buffer): Promise<string> {
        await this.initialize();

        await this.client.putObject(this.bucket, key, data, data.length, {
            'Content-Type': 'text/csv',
        });

        console.log(`✓ Uploaded CSV: ${key} (${data.length} bytes)`);
        return key;
    }

    /**
     * Download CSV file from MinIO
     * @param key - Object key
     * @returns File buffer
     */
    async downloadCSV(key: string): Promise<Buffer> {
        await this.initialize();

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            this.client.getObject(this.bucket, key, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        });
    }

    /**
     * Get readable stream for CSV file (for large files)
     * @param key - Object key
     * @returns Readable stream
     */
    async getCSVStream(key: string): Promise<Readable> {
        await this.initialize();

        return new Promise((resolve, reject) => {
            this.client.getObject(this.bucket, key, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(stream);
            });
        });
    }

    /**
     * Delete CSV file from MinIO
     * @param key - Object key
     */
    async deleteCSV(key: string): Promise<void> {
        await this.initialize();
        await this.client.removeObject(this.bucket, key);
        console.log(`✓ Deleted CSV: ${key}`);
    }

    /**
     * Generate a unique key for evaluation CSV
     */
    static generateKey(evaluationId: string): string {
        return `ground-truth/${evaluationId}.csv`;
    }
}

// Export singleton instance
export const minioService = new MinioService();

export default MinioService;
