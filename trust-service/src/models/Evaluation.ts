import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Evaluation status enum
 */
export enum EvaluationStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

/**
 * Evaluation attributes interface
 * Defines all fields in the Evaluation model
 */
export interface EvaluationAttributes {
    id: string;
    userId: string;
    projectId: string;
    modelId: string;
    status: EvaluationStatus;
    accuracy: number | null;
    precision: number | null;
    recall: number | null;
    f1Score: number | null;
    createdAt: Date;
}

/**
 * Evaluation creation attributes interface
 */
export interface EvaluationCreationAttributes extends Optional<EvaluationAttributes, 'id' | 'createdAt' | 'status' | 'accuracy' | 'precision' | 'recall' | 'f1Score'> { }

/**
 * Evaluation model class
 * Used by Trust Service to update evaluation status and metrics
 */
export class Evaluation extends Model<EvaluationAttributes, EvaluationCreationAttributes> implements EvaluationAttributes {
    public id!: string;
    public userId!: string;
    public projectId!: string;
    public modelId!: string;
    public status!: EvaluationStatus;
    public accuracy!: number | null;
    public precision!: number | null;
    public recall!: number | null;
    public f1Score!: number | null;
    public createdAt!: Date;

    public readonly updatedAt!: Date;
}

/**
 * Initialize Evaluation model with Sequelize
 */
Evaluation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'project_id',
        },
        modelId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'model_id',
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: EvaluationStatus.PENDING,
            validate: {
                isIn: {
                    args: [[EvaluationStatus.PENDING, EvaluationStatus.IN_PROGRESS, EvaluationStatus.COMPLETED, EvaluationStatus.FAILED]],
                    msg: 'Status must be PENDING, IN_PROGRESS, COMPLETED, or FAILED',
                },
            },
        },
        accuracy: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: true,
        },
        precision: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: true,
        },
        recall: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: true,
        },
        f1Score: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: true,
            field: 'f1_score',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
    },
    {
        sequelize,
        tableName: 'evaluations',
        timestamps: true,
        underscored: true,
    }
);

export default Evaluation;
