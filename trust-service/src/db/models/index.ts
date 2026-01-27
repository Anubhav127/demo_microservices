// Model exports and associations
import { EvaluationJob } from './EvaluationJob';
import { EvaluationResult } from './EvaluationResult';

// Define associations
EvaluationJob.hasOne(EvaluationResult, {
    foreignKey: 'job_id',
    as: 'result',
});

EvaluationResult.belongsTo(EvaluationJob, {
    foreignKey: 'job_id',
    as: 'job',
});

export { EvaluationJob, EvaluationResult };
