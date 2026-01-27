// Trust controller - handles evaluation job creation
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { evaluationRequestSchema } from '../validation/schemas';
import { EvaluationJob } from '../../db/models';
import { enqueueJob } from '../../queue/producer';
import { verifyModel } from '../../mocks/modelRegistry';
import { verifyDataset } from '../../mocks/objectStorage';
import { MetricType, JobPayload } from '../../types';

/**
 * Create an evaluation job for a specific metric type
 */
export function createEvaluationHandler(metricType: MetricType) {
    return async (req: Request, res: Response): Promise<void> => {
        try {
            // 1. Validate request with Zod
            const parseResult = evaluationRequestSchema.safeParse(req.body);

            if (!parseResult.success) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: parseResult.error.errors,
                });
                return;
            }

            const { model_id, dataset_id, config } = parseResult.data;

            // Get user ID from header (set by API Gateway after auth)
            const userId = req.headers['x-user-id'] as string || uuidv4();

            console.log(`[TrustController] Creating ${metricType} evaluation for model ${model_id}`);

            // 2. Verify model exists via Model Registry Service
            const modelMetadata = await verifyModel(model_id);
            if (!modelMetadata) {
                res.status(404).json({
                    error: 'Model not found',
                    model_id,
                });
                return;
            }

            // 3. Verify dataset exists
            const datasetMetadata = await verifyDataset(dataset_id);
            if (!datasetMetadata) {
                res.status(404).json({
                    error: 'Dataset not found',
                    dataset_id,
                });
                return;
            }

            // 4. Insert into evaluation_jobs
            const jobId = uuidv4();
            let job: EvaluationJob;

            try {
                job = await EvaluationJob.create({
                    id: jobId,
                    model_id,
                    metric_type: metricType,
                    dataset_id,
                    status: 'PENDING',
                    config: config || {},
                    requested_by: userId,
                    created_at: new Date(),
                });

                console.log(`[TrustController] Created job ${job.id}`);
            } catch (error: unknown) {
                // 5. Handle unique constraint violation - return existing job
                if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
                    const existingJob = await EvaluationJob.findOne({
                        where: {
                            model_id,
                            metric_type: metricType,
                            dataset_id,
                            status: ['PENDING', 'QUEUED', 'RUNNING'],
                        },
                    });

                    if (existingJob) {
                        console.log(`[TrustController] Returning existing job ${existingJob.id}`);
                        res.status(200).json({
                            job_id: existingJob.id,
                            status: existingJob.status,
                            message: 'Evaluation already in progress',
                        });
                        return;
                    }
                }
                throw error;
            }

            // 6. Enqueue BullMQ job
            const payload: JobPayload = {
                job_id: job.id,
                model_id,
                metric_type: metricType,
                dataset_id,
                config: config || {},
                requested_by: {
                    user_id: userId,
                    source: 'api',
                },
                created_at: job.created_at.toISOString(),
            };

            await enqueueJob(payload);

            // 7. Update status to QUEUED
            await job.update({
                status: 'QUEUED',
                queued_at: new Date(),
            });

            console.log(`[TrustController] Job ${job.id} enqueued successfully`);

            // 8. Return response
            res.status(201).json({
                job_id: job.id,
                status: 'QUEUED',
                model_id,
                metric_type: metricType,
                dataset_id,
            });
        } catch (error) {
            console.error(`[TrustController] Error creating ${metricType} evaluation:`, error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
}
