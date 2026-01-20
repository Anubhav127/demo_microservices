import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

/**
 * RefreshToken attributes interface
 */
export interface RefreshTokenAttributes {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

/**
 * RefreshToken creation attributes interface
 */
export interface RefreshTokenCreationAttributes
    extends Optional<RefreshTokenAttributes, 'id' | 'createdAt'> { }

/**
 * RefreshToken model class
 * Stores refresh tokens for token-based authentication
 */
export class RefreshToken
    extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
    implements RefreshTokenAttributes {
    public id!: string;
    public userId!: string;
    public token!: string;
    public expiresAt!: Date;
    public createdAt!: Date;

    // Virtual field for association
    public readonly user?: User;

    /**
     * Check if the token is expired
     */
    public isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
}

/**
 * Initialize RefreshToken model with Sequelize
 */
RefreshToken.init(
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
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        token: {
            type: DataTypes.STRING(500),
            allowNull: false,
            unique: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at',
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
        tableName: 'refresh_tokens',
        timestamps: false,
        underscored: true,
        indexes: [
            {
                fields: ['user_id'],
                name: 'refresh_tokens_user_id_idx',
            },
            {
                unique: true,
                fields: ['token'],
                name: 'refresh_tokens_token_idx',
            },
            {
                fields: ['expires_at'],
                name: 'refresh_tokens_expires_at_idx',
            },
        ],
    }
);

// Define association
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });

export default RefreshToken;
