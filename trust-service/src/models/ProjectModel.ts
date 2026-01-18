import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * ProjectModel junction table for many-to-many
 */
export interface ProjectModelAttributes {
    projectId: string;
    modelId: string;
    createdAt?: Date;
}

export class ProjectModel extends Model<ProjectModelAttributes> implements ProjectModelAttributes {
    public projectId!: string;
    public modelId!: string;
    public createdAt!: Date;
}

ProjectModel.init(
    {
        projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'project_id',
            primaryKey: true,
            references: { model: 'projects', key: 'id' },
            onDelete: 'CASCADE',
        },
        modelId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'model_id',
            primaryKey: true,
            references: { model: 'ai_models', key: 'id' },
            onDelete: 'CASCADE',
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
        tableName: 'project_models',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['project_id'], name: 'project_models_project_idx' },
            { fields: ['model_id'], name: 'project_models_model_idx' },
        ],
    }
);

export default ProjectModel;
