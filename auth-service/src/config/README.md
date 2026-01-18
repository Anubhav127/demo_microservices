# Database Configuration

This module provides a shared Sequelize instance for database connectivity across the auth-service.

## Features

- ✅ Reads configuration from environment variables
- ✅ Connection pooling with configurable limits
- ✅ Proper error handling for connection failures
- ✅ Timezone configuration (UTC)
- ✅ Snake_case naming convention for database fields
- ✅ Development logging support

## Usage

### Basic Import

```typescript
import { sequelize } from './config/database';

// Use sequelize instance to define models
// Example: User.init({ ... }, { sequelize });
```

### Testing Connection

```typescript
import { testConnection } from './config/database';

// Test database connectivity
await testConnection();
```

### Closing Connection

```typescript
import { closeConnection } from './config/database';

// Gracefully close database connection
await closeConnection();
```

### Syncing Database

```typescript
import { syncDatabase } from './config/database';

// Sync all models (development only)
await syncDatabase();

// Force sync (drops and recreates tables - use with caution!)
await syncDatabase({ force: true });

// Alter sync (modifies existing tables to match models)
await syncDatabase({ alter: true });
```

## Environment Variables

The following environment variables are used for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ai_evaluation_platform` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `NODE_ENV` | Environment (affects logging) | - |

## Connection Pool Configuration

The connection pool is configured with the following settings:

- **Max connections**: 10
- **Min connections**: 0
- **Acquire timeout**: 30000ms (30 seconds)
- **Idle timeout**: 10000ms (10 seconds)

## Example: Using in a Model

```typescript
import { DataTypes, Model } from 'sequelize';
import { sequelize } from './config/database';

class User extends Model {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: string;
  public readonly createdAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'USER',
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  }
);

export default User;
```

## Example: Using in Application Startup

```typescript
import express from 'express';
import { testConnection } from './config/database';

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## Error Handling

The module includes proper error handling for:

- Connection failures
- Authentication errors
- Network timeouts
- Invalid configuration

All errors are logged to the console and re-thrown for proper handling by the calling code.

## Testing

Run the database configuration tests:

```bash
npm test -- src/config/database.test.ts
```

The tests verify:
- Sequelize instance creation
- Correct dialect (postgres)
- Connection pool configuration
- Define options (timestamps, underscored, freezeTableName)
- Environment variable defaults
- Database connectivity (when database is available)
