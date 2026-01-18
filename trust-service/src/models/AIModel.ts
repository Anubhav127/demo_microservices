import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * AIModel attributes interface
 * Minimal model for Trust Service to fetch endpoint URL
 */
export interface AIModelAttributes {
    id: string;
    modelName: string;
    endpointUrl: string;
    createdAt: Date;
}

export interface AIModelCreationAttributes extends Optional<AIModelAttributes, 'id' | 'createdAt'> { }

export class AIModel extends Model<AIModelAttributes, AIModelCreationAttributes> implements AIModelAttributes {
    public id!: string;
    public modelName!: string;
    public endpointUrl!: string;
    public createdAt!: Date;
    public readonly updatedAt!: Date;
}

AIModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        modelName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'model_name',
        },
        endpointUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: 'endpoint_url',
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
        tableName: 'ai_models',
        timestamps: true,
        underscored: true,
    }
);

export default AIModel;
