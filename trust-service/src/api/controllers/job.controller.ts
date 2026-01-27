// Job controller - handles job status queries
import { Request, Response } from 'express';
import { jobIdSchema } from '../validation/schemas';
import { EvaluationJob } from '../../db/models';

/**
 * Get job status and metadata
 */
export async function getJobStatus(req: Request, res: Response): Promise<void> {
    try {
        // Validate job ID
        const parseResult = jobIdSchema.safeParse(req.params);

        if (!parseResult.success) {
            res.status(400).json({
                error: 'Invalid job ID',
                details: parseResult.error.errors,
            });
            return;
        }

        const { jobId } = parseResult.data;

        // Fetch job from database
        const job = await EvaluationJob.findByPk(jobId);

        if (!job) {
            res.status(404).json({
                error: 'Job not found',
                job_id: jobId,
            });
            return;
        }

        console.log(`[JobController] Retrieved status for job ${jobId}: ${job.status}`);

        res.status(200).json({
            job_id: job.id,
            model_id: job.model_id,
            metric_type: job.metric_type,
            dataset_id: job.dataset_id,
            status: job.status,
            retry_count: job.retry_count,
            error_message: job.error_message,
            created_at: job.created_at,
            queued_at: job.queued_at,
            started_at: job.started_at,
            finished_at: job.finished_at,
        });
    } catch (error) {
        console.error('[JobController] Error getting job status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
