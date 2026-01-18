import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * User role enum
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
}

/**
 * User attributes interface
 * Defines all fields in the User model
 */
export interface UserAttributes {
  id: string;           // UUID, primary key
  email: string;        // Unique, not null
  passwordHash: string; // Not null (stored as password_hash in DB)
  role: UserRole;       // SUPER_ADMIN or USER, default USER
  createdAt: Date;      // Timestamp
}

/**
 * User creation attributes interface
 * Defines fields required when creating a new user
 * (id and createdAt are auto-generated)
 */
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'role'> {}

/**
 * User model class
 * Represents a user in the authentication system
 */
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: UserRole;
  public createdAt!: Date;

  // Timestamps
  public readonly updatedAt!: Date;
}

/**
 * Initialize User model with Sequelize
 */
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the user',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'users_email_unique',
        msg: 'Email address already exists',
      },
      validate: {
        isEmail: {
          msg: 'Must be a valid email address',
        },
        notEmpty: {
          msg: 'Email cannot be empty',
        },
      },
      comment: 'User email address (unique)',
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash', // Map to snake_case column name
      validate: {
        notEmpty: {
          msg: 'Password hash cannot be empty',
        },
      },
      comment: 'Bcrypt hashed password',
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: UserRole.USER,
      validate: {
        isIn: {
          args: [[UserRole.SUPER_ADMIN, UserRole.USER]],
          msg: 'Role must be either SUPER_ADMIN or USER',
        },
      },
      comment: 'User role for RBAC (SUPER_ADMIN or USER)',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at', // Map to snake_case column name
      comment: 'Timestamp when user was created',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true, // Enable timestamps (createdAt, updatedAt)
    underscored: true, // Use snake_case for column names
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'users_email_idx',
      },
    ],
  }
);

export default User;
