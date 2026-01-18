# Design Document: AI Model Evaluation Platform

## Overview

The AI Model Evaluation Platform is a backend-only MVP consisting of four microservices that work together to evaluate AI/LLM models asynchronously. The architecture follows a microservices pattern with an API Gateway as the single entry point, separate Auth and Trust services for specific responsibilities, and a FastAPI Mock AI service for testing.

The system uses Kafka for asynchronous job processing, PostgreSQL with Sequelize ORM for persistence, and JWT-based authentication with role-based access control.

### Key Design Decisions

1. **Microservices Architecture**: Separates concerns into distinct services for scalability and maintainability
2. **Asynchronous Processing**: Kafka enables long-running evaluations without blocking API responses
3. **Database-Based Locking**: Uses evaluation status column to prevent duplicate evaluations (simpler than distributed locks)
4. **No Retry Strategy**: Failed evaluations are marked as FAILED without automatic retries (per requirements)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Gateway (:3000)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ JWT Validate│  │    RBAC     │  │   Router    │  │Kafka Producer│    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│  Auth Service (:3001)│              │ Trust Service (:3002)│
│  ┌───────────────┐  │              │  ┌───────────────┐  │
│  │  Registration │  │              │  │Kafka Consumer │  │
│  │     Login     │  │              │  │ CSV Loader    │  │
│  │  JWT Issuer   │  │              │  │Metrics Compute│  │
│  └───────────────┘  │              │  └───────────────┘  │
└─────────────────────┘              └─────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │Mock AI Service(:8000)│
                                    │     (FastAPI)        │
                                    └─────────────────────┘
           │                                    │
           └────────────────┬───────────────────┘
                            ▼
                  ┌─────────────────────┐
                  │   PostgreSQL DB     │
                  │   (Sequelize ORM)   │
                  └─────────────────────┘
                            │
                  ┌─────────────────────┐
                  │       Kafka         │
                  │ (model-evaluation-  │
                  │       jobs)         │
                  └─────────────────────┘
```

## Components and Interfaces

### API Gateway

The API Gateway is the single public entry point handling authentication, authorization, and request routing.

```typescript
// Middleware interfaces
interface JWTPayload {
  userId: string;
  role: 'SUPER_ADMIN' | 'USER';
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// Route handlers
interface RouteHandlers {
  // Auth routes (proxied to Auth Service)
  postRegister(req: Request): Promise<{ userId: string; email: string }>;
  postLogin(req: Request): Promise<{ accessToken: string }>;
  
  // Project routes
  postProject(req: AuthenticatedRequest): Promise<Project>;
  getProjects(req: AuthenticatedRequest): Promise<Project[]>;
  
  // Model routes
  postModel(req: AuthenticatedRequest): Promise<AIModel>;
  postProjectModel(req: AuthenticatedRequest): Promise<ProjectModel>;
  
  // Evaluation routes
  postEvaluate(req: AuthenticatedRequest): Promise<Evaluation>;
  getEvaluation(req: AuthenticatedRequest): Promise<Evaluation>;
}

// Kafka producer interface
interface EvaluationJobMessage {
  evaluationId: string;
  userId: string;
  projectId: string;
  modelId: string;
}
```

### Auth Service

Handles user registration, login, and JWT token generation.

```typescript
interface AuthService {
  register(email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<string>; // Returns JWT
  validateToken(token: string): Promise<JWTPayload>;
}

interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

interface JWTService {
  sign(payload: { userId: string; role: string }): string;
  verify(token: string): JWTPayload;
}
```

### Trust Service (Performance)

Consumes evaluation jobs, calls AI models, and computes performance metrics.

```typescript
interface TrustService {
  processEvaluationJob(job: EvaluationJobMessage): Promise<void>;
}

interface CSVLoader {
  loadGroundTruth(filePath: string): Promise<GroundTruthRow[]>;
}

interface GroundTruthRow {
  input: Record<string, unknown>;
  expectedLabel: number;
}

interface AIModelClient {
  predict(endpointUrl: string, input: Record<string, unknown>): Promise<AIResponse>;
}

interface AIResponse {
  prediction: number;
  confidence: string;
}

interface MetricsCalculator {
  compute(predictions: number[], actuals: number[]): PerformanceMetrics;
}

interface PerformanceMetrics {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}
```

### Mock AI Service (FastAPI)

```python
# FastAPI endpoint interface
@app.post("/predict")
async def predict(payload: PredictRequest) -> PredictResponse:
    """
    Accepts input payload and returns mock prediction.
    
    Request: { "input": { ... } }
    Response: { "prediction": 0 | 1, "confidence": "low" | "medium" | "high" }
    """
    pass
```

## Data Models

### Sequelize Models

```typescript
// User Model
interface UserAttributes {
  id: string;           // UUID, primary key
  email: string;        // Unique, not null
  passwordHash: string; // Not null
  role: 'SUPER_ADMIN' | 'USER'; // Default: 'USER'
  createdAt: Date;
}

// Project Model
interface ProjectAttributes {
  id: string;           // UUID, primary key
  userId: string;       // Foreign key to users
  name: string;         // Not null
  createdAt: Date;
}

// AIModel Model
interface AIModelAttributes {
  id: string;           // UUID, primary key
  modelName: string;    // Not null
  endpointUrl: string;  // Not null
  createdAt: Date;
}

// ProjectModel (Junction Table)
interface ProjectModelAttributes {
  projectId: string;    // Foreign key to projects
  modelId: string;      // Foreign key to ai_models
}

// Evaluation Model
interface EvaluationAttributes {
  id: string;           // UUID, primary key
  userId: string;       // Foreign key to users
  projectId: string;    // Foreign key to projects
  modelId: string;      // Foreign key to ai_models
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  createdAt: Date;
}
```

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('SUPER_ADMIN', 'USER')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Models table
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(255) NOT NULL,
  endpoint_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project-Models junction table
CREATE TABLE project_models (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, model_id)
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  accuracy DECIMAL(5,4),
  precision DECIMAL(5,4),
  recall DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for evaluation locking queries
CREATE INDEX idx_evaluations_user_model_status 
  ON evaluations(user_id, model_id, created_at DESC);
```

### Kafka Message Schema

```typescript
// Topic: model-evaluation-jobs
interface EvaluationJobMessage {
  evaluationId: string;  // UUID of the created evaluation record
  userId: string;        // UUID of the user who triggered evaluation
  projectId: string;     // UUID of the project
  modelId: string;       // UUID of the AI model to evaluate
}
```

### Ground Truth CSV Format

```csv
input_feature_1,input_feature_2,expected_label
0.5,0.3,1
0.2,0.8,0
0.9,0.1,1
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password Hashing Integrity

*For any* password provided during registration, the stored password_hash SHALL NOT equal the plaintext password, AND bcrypt.compare(password, password_hash) SHALL return true.

**Validates: Requirements 1.5**

### Property 2: JWT Round-Trip Consistency

*For any* user who successfully logs in, the returned JWT token when decoded SHALL contain the correct user_id and role claims matching the registered user, AND the token SHALL be verifiable with the signing secret.

**Validates: Requirements 1.3, 1.6**

### Property 3: RBAC Enforcement

*For any* request with a USER role JWT attempting to access SUPER_ADMIN-only endpoints, the API_Gateway SHALL return a 403 Forbidden response.

**Validates: Requirements 2.3**

### Property 4: Project Ownership Invariant

*For any* user with N created projects, querying that user's projects SHALL return exactly N projects, AND each returned project SHALL have user_id matching the querying user's ID.

**Validates: Requirements 3.1, 3.2**

### Property 5: Model-Project Many-to-Many Relationship

*For any* AI model, linking it to M distinct projects SHALL result in M entries in the project_models junction table, AND the model SHALL be retrievable from each linked project.

**Validates: Requirements 4.3**

### Property 6: Evaluation Locking Correctness

*For any* user and model combination with an existing IN_PROGRESS evaluation, triggering a new evaluation SHALL return a 409 Conflict error. *For any* user and model combination without an IN_PROGRESS evaluation, triggering a new evaluation SHALL create a PENDING evaluation record.

**Validates: Requirements 5.2, 5.3**

### Property 7: Kafka Message Integrity

*For any* evaluation record created with PENDING status, a Kafka message SHALL be published to "model-evaluation-jobs" topic containing evaluationId, userId, projectId, and modelId fields matching the created evaluation record.

**Validates: Requirements 5.4, 5.5**

### Property 8: Metrics Computation Correctness

*For any* array of predictions and corresponding ground truth labels:
- TP + TN + FP + FN SHALL equal the total number of samples
- Accuracy SHALL equal (TP + TN) / total
- Precision SHALL equal TP / (TP + FP) when (TP + FP) > 0, else 0
- Recall SHALL equal TP / (TP + FN) when (TP + FN) > 0, else 0
- F1 Score SHALL equal 2 * (Precision * Recall) / (Precision + Recall) when (Precision + Recall) > 0, else 0

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 9: Evaluation State Machine

*For any* evaluation job received by Trust_Service:
- Status SHALL transition from PENDING to IN_PROGRESS upon job receipt
- Status SHALL transition from IN_PROGRESS to COMPLETED upon successful metric computation
- Status SHALL transition from IN_PROGRESS to FAILED upon any error
- No other status transitions SHALL occur

**Validates: Requirements 6.1, 7.6, 7.7**

### Property 10: Failure Handling Without Retry

*For any* evaluation that encounters an error (API failure, invalid JSON, CSV read failure), the evaluation status SHALL be set to FAILED, AND no retry attempt SHALL be made, AND the FAILED status SHALL be persisted to the database.

**Validates: Requirements 9.1, 9.4, 9.5**

### Property 11: Evaluation History Preservation

*For any* sequence of N evaluations created for a user/model combination, querying evaluations SHALL return all N records regardless of their status (PENDING, IN_PROGRESS, COMPLETED, FAILED).

**Validates: Requirements 11.6**

## Error Handling

### API Gateway Errors

| Error Condition | HTTP Status | Response Body |
|----------------|-------------|---------------|
| Missing JWT token | 401 | `{ "error": "Unauthorized", "message": "Missing authentication token" }` |
| Invalid/expired JWT | 401 | `{ "error": "Unauthorized", "message": "Invalid or expired token" }` |
| Insufficient permissions | 403 | `{ "error": "Forbidden", "message": "Insufficient permissions" }` |
| Evaluation already running | 409 | `{ "error": "Conflict", "message": "Evaluation already in progress" }` |
| Resource not found | 404 | `{ "error": "Not Found", "message": "Resource not found" }` |
| Validation error | 400 | `{ "error": "Bad Request", "message": "<validation details>" }` |

### Auth Service Errors

| Error Condition | HTTP Status | Response Body |
|----------------|-------------|---------------|
| Email already exists | 409 | `{ "error": "Conflict", "message": "Email already registered" }` |
| Invalid credentials | 401 | `{ "error": "Unauthorized", "message": "Invalid email or password" }` |
| Invalid email format | 400 | `{ "error": "Bad Request", "message": "Invalid email format" }` |
| Password too weak | 400 | `{ "error": "Bad Request", "message": "Password does not meet requirements" }` |

### Trust Service Errors

| Error Condition | Action |
|----------------|--------|
| CSV file not found | Mark evaluation FAILED, log error |
| CSV parse error | Mark evaluation FAILED, log error |
| AI service unreachable | Mark evaluation FAILED, log error |
| AI service returns non-200 | Mark evaluation FAILED, log error |
| AI response invalid JSON | Mark evaluation FAILED, log error |
| AI response missing fields | Mark evaluation FAILED, log error |
| Database update fails | Log error, evaluation remains IN_PROGRESS |

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;      // Error type (e.g., "Unauthorized", "Conflict")
  message: string;    // Human-readable description
  details?: unknown;  // Optional additional context
}
```

## Testing Strategy

### Dual Testing Approach

This platform requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, integration points, and error conditions
- **Property tests**: Verify universal properties across randomly generated inputs

### Property-Based Testing Configuration

- **Library**: fast-check (TypeScript property-based testing library)
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: ai-model-evaluation-platform, Property {N}: {property_text}`

### Test Categories

#### Unit Tests

1. **Auth Service**
   - Registration with valid/invalid inputs
   - Login with correct/incorrect credentials
   - JWT token generation and validation
   - Password hashing verification

2. **API Gateway**
   - Route authentication middleware
   - RBAC middleware for different roles
   - Request validation
   - Evaluation locking logic

3. **Trust Service**
   - CSV parsing with various formats
   - AI response parsing
   - Metrics calculation edge cases (all zeros, all ones, mixed)
   - Status transition logic

4. **Mock AI Service**
   - Endpoint response format
   - Input payload handling

#### Property-Based Tests

Each correctness property from the design document SHALL be implemented as a property-based test:

1. **Property 1 Test**: Generate random passwords, verify hashing integrity
2. **Property 2 Test**: Generate random user data, verify JWT round-trip
3. **Property 3 Test**: Generate requests with USER role, verify RBAC rejection
4. **Property 4 Test**: Generate users with random project counts, verify ownership
5. **Property 5 Test**: Generate models linked to random projects, verify many-to-many
6. **Property 6 Test**: Generate evaluation scenarios, verify locking behavior
7. **Property 7 Test**: Generate evaluations, verify Kafka message content
8. **Property 8 Test**: Generate prediction/label arrays, verify metric formulas
9. **Property 9 Test**: Generate evaluation jobs, verify state transitions
10. **Property 10 Test**: Generate failure scenarios, verify no retry and FAILED status
11. **Property 11 Test**: Generate evaluation sequences, verify history preservation

### Integration Tests

1. **End-to-end evaluation flow**: Register → Login → Create Project → Register Model → Link Model → Trigger Evaluation → Poll Status → Verify Metrics
2. **Kafka message flow**: Verify messages are produced and consumed correctly
3. **Database consistency**: Verify foreign key relationships and constraints

### Test Data Generators (fast-check)

```typescript
// Example generators for property tests
const emailArb = fc.emailAddress();
const passwordArb = fc.string({ minLength: 8, maxLength: 64 });
const projectNameArb = fc.string({ minLength: 1, maxLength: 255 });
const endpointUrlArb = fc.webUrl();
const predictionArb = fc.integer({ min: 0, max: 1 });
const predictionsArrayArb = fc.array(predictionArb, { minLength: 1, maxLength: 1000 });
```
