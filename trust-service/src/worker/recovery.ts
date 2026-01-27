// Timeout recovery task
import { sequelize } from '../db/config';
import { config } from '../config';

/**
 * Recover stuck jobs that have been running for too long
 * This handles cases where workers crash during job execution
 */
export async function recoverStuckJobs(): Promise<number> {
    const timeoutMinutes = config.recovery.timeoutMinutes;

    console.log(`[Recovery] Checking for jobs stuck in RUNNING for > ${timeoutMinutes} minutes`);

    const [, metadata] = await sequelize.query(`
    UPDATE evaluation_jobs
    SET status = 'FAILED',
        error_message = 'Worker timeout: Job exceeded maximum execution time',
        finished_at = NOW()
    WHERE status = 'RUNNING'
      AND started_at < NOW() - INTERVAL '${timeoutMinutes} minutes'
  `, {
        type: 'UPDATE',
    }) as [unknown, { rowCount?: number }];

    const recoveredCount = metadata?.rowCount || 0;

    if (recoveredCount > 0) {
        console.log(`[Recovery] Recovered ${recoveredCount} stuck job(s)`);
    }

    return recoveredCount;
}

/**
 * Start the recovery task to run periodically
 */
export function startRecoveryTask(): NodeJS.Timer {
    const intervalMs = config.recovery.intervalMs;

    console.log(`[Recovery] Starting recovery task (interval: ${intervalMs / 1000}s)`);

    // Run immediately on startup
    recoverStuckJobs().catch(err => {
        console.error('[Recovery] Initial recovery failed:', err);
    });

    // Run periodically
    return setInterval(() => {
        recoverStuckJobs().catch(err => {
            console.error('[Recovery] Recovery task failed:', err);
        });
    }, intervalMs);
}
