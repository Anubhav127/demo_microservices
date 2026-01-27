# Trust Microservice

Production-grade Trust Microservice for evaluating ML models on trust metrics (performance, fairness, ethics, robustness).

## Architecture

The service consists of two components:
- **API Server**: Stateless Express server handling job creation, status queries, and result retrieval
- **Worker**: BullMQ worker processing evaluation jobs with strict concurrency limits

## Tech Stack

- **Language**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL (Sequelize ORM)
- **Queue**: BullMQ (Redis-backed)
- **Validation**: Zod

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start API server:
```bash
npm run dev:api
```

5. Start worker (separate terminal):
```bash
npm run dev:worker
```

### Docker Deployment

```bash
# Build images
docker compose build trust-api trust-worker

# Start services
docker compose up -d trust-db redis trust-api trust-worker
```

## API Endpoints

### Create Evaluation Jobs

```bash
# Performance evaluation
POST /trust/performance
{
  "model_id": "uuid",
  "dataset_id": "uuid",
  "config": {}
}

# Fairness evaluation
POST /trust/fairness

# Ethics evaluation
POST /trust/ethics

# Robustness evaluation
POST /trust/robustness
```

### Query Job Status

```bash
GET /trust/jobs/{job_id}
```

### Get Results

```bash
GET /trust/jobs/{job_id}/result
```

## Example Usage

```bash
# Create a performance evaluation
curl -X POST http://localhost:3002/trust/performance \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "550e8400-e29b-41d4-a716-446655440001",
    "dataset_id": "660e8400-e29b-41d4-a716-446655440001",
    "config": {}
  }'

# Response:
# { "job_id": "...", "status": "QUEUED", ... }

# Check job status
curl http://localhost:3002/trust/jobs/{job_id}

# Get results (when completed)
curl http://localhost:3002/trust/jobs/{job_id}/result
```

## Job States

| Status | Description |
|--------|-------------|
| PENDING | Job created, not yet queued |
| QUEUED | Job in BullMQ queue, waiting for worker |
| RUNNING | Worker is processing the job |
| COMPLETED | Evaluation finished successfully |
| FAILED | Evaluation failed with error |
| CANCELLED | Job was cancelled |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3002 | API server port |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | trust_db | Database name |
| DB_USER | trust_user | Database user |
| DB_PASSWORD | trust_password | Database password |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| WORKER_CONCURRENCY | 10 | Max concurrent evaluations |

## Scaling

- **API Layer**: Stateless, scales horizontally
- **Worker Layer**: Concurrency-capped, manual scaling only
- **Database**: Single source of truth
- **Redis**: Execution coordination only, not source of truth

## Recovery

The worker includes automatic recovery for stuck jobs:
- Jobs in RUNNING state for >30 minutes are marked FAILED
- Recovery task runs every 5 minutes

## Project Structure

```
trust-service/
├── src/
│   ├── api/              # Express API server
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # Route definitions
│   │   ├── validation/   # Zod schemas
│   │   └── server.ts     # Entry point
│   ├── worker/           # BullMQ worker
│   │   ├── evaluators/   # Metric evaluators
│   │   ├── processor.ts  # Job processor
│   │   ├── recovery.ts   # Timeout recovery
│   │   └── index.ts      # Entry point
│   ├── db/               # Database layer
│   │   ├── models/       # Sequelize models
│   │   ├── migrations/   # DB migrations
│   │   └── config.ts     # Connection config
│   ├── queue/            # BullMQ configuration
│   ├── mocks/            # Mock external services
│   ├── config/           # Environment config
│   └── types/            # TypeScript types
├── Dockerfile
├── package.json
└── tsconfig.json
```
