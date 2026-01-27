// EvaluationResult model
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';
import { MetricType } from '../../types';

interface EvaluationResultAttributes {
    id: string;
    job_id: string;
    metric_type: MetricType;
    summary: Record<string, unknown>;
    created_at: Date;
}

interface EvaluationResultCreationAttributes extends Optional<EvaluationResultAttributes, 'id' | 'created_at'> { }

export class EvaluationResult extends Model<EvaluationResultAttributes, EvaluationResultCreationAttributes>
    implements EvaluationResultAttributes {
    declare id: string;
    declare job_id: string;
    declare metric_type: MetricType;
    declare summary: Record<string, unknown>;
    declare created_at: Date;
}

EvaluationResult.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        job_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        metric_type: {
            type: DataTypes.STRING(32),
            allowNull: false,
            validate: {
                isIn: [['performance', 'fairness', 'ethics', 'robustness']],
            },
        },
        summary: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'evaluation_results',
        timestamps: false,
        indexes: [
            {
                name: 'idx_evaluation_results_job_id',
                fields: ['job_id'],
                unique: true,
            },
        ],
    }
);
