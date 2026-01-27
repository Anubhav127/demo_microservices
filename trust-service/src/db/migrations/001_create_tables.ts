// Database migration: Create evaluation_jobs and evaluation_results tables
import { sequelize } from '../config';

async function migrate(): Promise<void> {
    console.log('Starting database migration...');

    try {
        // Create evaluation_jobs table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS evaluation_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id UUID NOT NULL,
        metric_type VARCHAR(32) NOT NULL CHECK (metric_type IN ('performance', 'fairness', 'ethics', 'robustness')),
        dataset_id UUID NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
        config JSONB NOT NULL DEFAULT '{}',
        requested_by UUID NOT NULL,
        error_message TEXT,
        retry_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        queued_at TIMESTAMP,
        started_at TIMESTAMP,
        finished_at TIMESTAMP
      );
    `);
        console.log('Created evaluation_jobs table');

        // Create evaluation_results table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS evaluation_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID UNIQUE NOT NULL REFERENCES evaluation_jobs(id) ON DELETE CASCADE,
        metric_type VARCHAR(32) NOT NULL CHECK (metric_type IN ('performance', 'fairness', 'ethics', 'robustness')),
        summary JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
        console.log('Created evaluation_results table');

        // Create indexes
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_status ON evaluation_jobs(status);
    `);

        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_model_id ON evaluation_jobs(model_id);
    `);

        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluation_results_job_id ON evaluation_results(job_id);
    `);
        console.log('Created indexes');

        // Create idempotency constraint - unique active evaluations per model/metric/dataset
        await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_eval
      ON evaluation_jobs (model_id, metric_type, dataset_id)
      WHERE status IN ('PENDING', 'QUEUED', 'RUNNING');
    `);
        console.log('Created idempotency constraint');

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run migration if executed directly
if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { migrate };
