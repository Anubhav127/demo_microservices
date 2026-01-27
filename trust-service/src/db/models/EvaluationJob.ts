// EvaluationJob model
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';
import { JobStatus, MetricType } from '../../types';

interface EvaluationJobAttributes {
    id: string;
    model_id: string;
    metric_type: MetricType;
    dataset_id: string;
    status: JobStatus;
    config: Record<string, unknown>;
    requested_by: string;
    error_message: string | null;
    retry_count: number;
    created_at: Date;
    queued_at: Date | null;
    started_at: Date | null;
    finished_at: Date | null;
}

interface EvaluationJobCreationAttributes extends Optional<EvaluationJobAttributes,
    'error_message' | 'retry_count' | 'queued_at' | 'started_at' | 'finished_at'> { }

export class EvaluationJob extends Model<EvaluationJobAttributes, EvaluationJobCreationAttributes>
    implements EvaluationJobAttributes {
    declare id: string;
    declare model_id: string;
    declare metric_type: MetricType;
    declare dataset_id: string;
    declare status: JobStatus;
    declare config: Record<string, unknown>;
    declare requested_by: string;
    declare error_message: string | null;
    declare retry_count: number;
    declare created_at: Date;
    declare queued_at: Date | null;
    declare started_at: Date | null;
    declare finished_at: Date | null;
}

EvaluationJob.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        model_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        metric_type: {
            type: DataTypes.STRING(32),
            allowNull: false,
            validate: {
                isIn: [['performance', 'fairness', 'ethics', 'robustness']],
            },
        },
        dataset_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: 'PENDING',
            validate: {
                isIn: [['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']],
            },
        },
        config: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        requested_by: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        retry_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        queued_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        finished_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'evaluation_jobs',
        timestamps: false,
        indexes: [
            {
                name: 'idx_evaluation_jobs_status',
                fields: ['status'],
            },
            {
                name: 'idx_evaluation_jobs_model_id',
                fields: ['model_id'],
            },
        ],
    }
);
