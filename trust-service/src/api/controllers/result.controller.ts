// Result controller - handles result queries
import { Request, Response } from 'express';
import { jobIdSchema } from '../validation/schemas';
import { EvaluationJob, EvaluationResult } from '../../db/models';

/**
 * Get evaluation results for a completed job
 */
export async function getJobResult(req: Request, res: Response): Promise<void> {
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

        // Check job status
        if (job.status === 'FAILED') {
            console.log(`[ResultController] Job ${jobId} failed: ${job.error_message}`);
            res.status(200).json({
                job_id: job.id,
                status: 'FAILED',
                error_message: job.error_message,
            });
            return;
        }

        if (job.status !== 'COMPLETED') {
            console.log(`[ResultController] Job ${jobId} not completed yet: ${job.status}`);
            res.status(409).json({
                error: 'Job not completed',
                job_id: jobId,
                status: job.status,
                message: 'Results are only available for completed jobs',
            });
            return;
        }

        // Fetch result
        const result = await EvaluationResult.findOne({
            where: { job_id: jobId },
        });

        if (!result) {
            res.status(500).json({
                error: 'Result not found',
                job_id: jobId,
                message: 'Job is completed but no result was stored',
            });
            return;
        }

        console.log(`[ResultController] Retrieved result for job ${jobId}`);

        res.status(200).json({
            job_id: job.id,
            metric_type: result.metric_type,
            status: 'COMPLETED',
            summary: result.summary,
            created_at: result.created_at,
            evaluation_started_at: job.started_at,
            evaluation_finished_at: job.finished_at,
        });
    } catch (error) {
        console.error('[ResultController] Error getting job result:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
