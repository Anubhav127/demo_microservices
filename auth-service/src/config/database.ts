import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Database configuration interface
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Load database configuration from environment variables
 */
const getDatabaseConfig = (): DatabaseConfig => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || 'ai_evaluation_platform';
  const username = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';

  return {
    host,
    port,
    database,
    username,
    password,
  };
};

/**
 * Create and configure Sequelize instance
 */
const createSequelizeInstance = (): Sequelize => {
  const config = getDatabaseConfig();

  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: 'postgres',
      
      // Connection pool configuration
      pool: {
        max: 10,          // Maximum number of connections in pool
        min: 0,           // Minimum number of connections in pool
        acquire: 30000,   // Maximum time (ms) to try to get connection before throwing error
        idle: 10000,      // Maximum time (ms) a connection can be idle before being released
      },
      
      // Logging configuration
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      
      // Timezone configuration
      timezone: '+00:00',
      
      // Define options
      define: {
        timestamps: true,
        underscored: true,  // Use snake_case for automatically added attributes
        freezeTableName: true, // Prevent Sequelize from pluralizing table names
      },
    }
  );

  return sequelize;
};

/**
 * Shared Sequelize instance
 */
export const sequelize = createSequelizeInstance();

/**
 * Test database connection
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed successfully');
  } catch (error) {
    console.error('✗ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Sync database models (use with caution in production)
 */
export const syncDatabase = async (options?: { force?: boolean; alter?: boolean }): Promise<void> => {
  try {
    await sequelize.sync(options);
    console.log('✓ Database synchronized successfully');
  } catch (error) {
    console.error('✗ Error synchronizing database:', error);
    throw error;
  }
};

export default sequelize;
