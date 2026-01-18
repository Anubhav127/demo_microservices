import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Project attributes interface
 */
export interface ProjectAttributes {
    id: string;
    userId: string;  // User ID from auth service (not a FK since separate DB)
    name: string;
    createdAt: Date;
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt'> { }

/**
 * Project model - owned by Trust Service
 */
export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
    public id!: string;
    public userId!: string;
    public name!: string;
    public createdAt!: Date;
    public readonly updatedAt!: Date;
}

Project.init(
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
            // Note: No FK reference since users table is in separate database
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Project name cannot be empty' },
            },
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
        tableName: 'projects',
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ['user_id'], name: 'projects_user_id_idx' }],
    }
);

export default Project;
