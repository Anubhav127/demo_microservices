# Implementation Tasks: AI Model Evaluation Platform

## Phase 1: Infrastructure Setup

### 1.1 Project Structure and Dependencies
- [x] Create root project structure with folders for api-gateway, auth-service, trust-service, and mock-ai-service
- [x] Initialize Node.js/Expess projects for api-gateway, auth-service, and trust-service with TypeScript
- [x] Initialize Python FastAPI project for mock-ai-service
- [x] Create docker-compose.yml with PostgreSQL, Kafka, and Zookeeper services
- [x] Create .env.example files for each service with required environment variables

**Validates: Requirements 11 (Database Schema)**

### 1.2 Database Setup
- [x] Create Sequelize configuration and connection module
- [-] Implement User model with id, email, password_hash, role, created_at fields
- [ ] Implement Project model with id, user_id, name, created_at fields
- [ ] Implement AIModel model with id, model_name, endpoint_url, created_at fields
- [ ] Implement ProjectModel junction table with project_id and model_id
- [ ] Implement Evaluation model with id, user_id, project_id, model_id, status, accuracy, precision, recall, f1_score, created_at fields
- [ ] Create database migration scripts for all tables
- [ ] Create index on evaluations(user_id, model_id, created_at DESC)

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

### 1.3 Kafka Setup
- [ ] Create Kafka producer module for API Gateway
- [ ] Create Kafka consumer module for Trust Service
- [ ] Configure "model-evaluation-jobs" topic
- [ ] Implement message serialization/deserialization for EvaluationJobMessage

**Validates: Requirements 5.4, 6.1**

## Phase 2: Auth Service Implementation

### 2.1 Password Hashing Module
- [ ] Implement PasswordHasher class with bcrypt
- [ ] Implement hash() method for password hashing
- [ ] Implement compare() method for password verification
- [ ] Write unit tests for password hashing edge cases

**Validates: Requirements 1.5**

### 2.2 JWT Service Module
- [ ] Implement JWTService class with jsonwebtoken library
- [ ] Implement sign() method to generate JWT with userId and role claims
- [ ] Implement verify() method to validate and decode JWT
- [ ] Configure JWT expiration time (e.g., 24 hours)
- [ ] Write unit tests for JWT generation and validation

**Validates: Requirements 1.6, 2.1**

### 2.3 User Registration Endpoint
- [ ] Create POST /auth/register endpoint
- [ ] Implement email validation
- [ ] Implement password strength validation
- [ ] Check for existing email and return 409 Conflict if duplicate
- [ ] Hash password using PasswordHasher
- [ ] Create user with USER role by default
- [ ] Return userId and email on success
- [ ] Write unit tests for registration success and failure cases

**Validates: Requirements 1.1, 1.2**

### 2.4 User Login Endpoint
- [ ] Create POST /auth/login endpoint
- [ ] Validate email and password presence
- [ ] Query user by email
- [ ] Compare password with stored hash using PasswordHasher
- [ ] Return 401 Unauthorized for invalid credentials
- [ ] Generate JWT token using JWTService on success
- [ ] Return accessToken on success
- [ ] Write unit tests for login success and failure cases

**Validates: Requirements 1.3, 1.4**

### 2.5 Property-Based Test: Password Hashing Integrity
- [ ] Write property test using fast-check to generate random passwords
- [ ] Verify stored password_hash does not equal plaintext password
- [ ] Verify bcrypt.compare(password, password_hash) returns true
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 1: Password Hashing Integrity"

**Validates: Requirements 1.5 (Property 1)**

### 2.6 Property-Based Test: JWT Round-Trip Consistency
- [ ] Write property test using fast-check to generate random user data
- [ ] Generate JWT token for user
- [ ] Decode JWT and verify userId and role claims match
- [ ] Verify token is verifiable with signing secret
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 2: JWT Round-Trip Consistency"

**Validates: Requirements 1.3, 1.6 (Property 2)**

## Phase 3: API Gateway - Authentication & Authorization

### 3.1 JWT Validation Middleware
- [ ] Create authenticateJWT middleware
- [ ] Extract JWT from Authorization header (Bearer token)
- [ ] Verify JWT using JWTService
- [ ] Return 401 Unauthorized for missing or invalid token
- [ ] Attach decoded user payload to request object
- [ ] Write unit tests for middleware with valid/invalid tokens

**Validates: Requirements 2.1, 2.2**

### 3.2 RBAC Middleware
- [ ] Create requireRole middleware accepting allowed roles
- [ ] Check user role from JWT payload
- [ ] Return 403 Forbidden if user role not in allowed roles
- [ ] Write unit tests for RBAC enforcement

**Validates: Requirements 2.3, 2.4**

### 3.3 Property-Based Test: RBAC Enforcement
- [ ] Write property test using fast-check to generate requests with USER role
- [ ] Attempt to access SUPER_ADMIN-only endpoints
- [ ] Verify API Gateway returns 403 Forbidden response
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 3: RBAC Enforcement"

**Validates: Requirements 2.3 (Property 3)**

## Phase 4: API Gateway - Project Management

### 4.1 Create Project Endpoint
- [ ] Create POST /projects endpoint with JWT authentication
- [ ] Validate project name presence and length
- [ ] Create project record with userId from JWT
- [ ] Return created project with id, userId, name, createdAt
- [ ] Write unit tests for project creation

**Validates: Requirements 3.1**

### 4.2 Get User Projects Endpoint
- [ ] Create GET /projects endpoint with JWT authentication
- [ ] Query projects by userId from JWT
- [ ] Return array of user's projects
- [ ] Write unit tests for retrieving projects

**Validates: Requirements 3.2**

### 4.3 Property-Based Test: Project Ownership Invariant
- [ ] Write property test using fast-check to generate users with random project counts
- [ ] Create N projects for user
- [ ] Query user's projects and verify exactly N projects returned
- [ ] Verify each project has userId matching the user
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 4: Project Ownership Invariant"

**Validates: Requirements 3.1, 3.2 (Property 4)**

## Phase 5: API Gateway - Model Management

### 5.1 Register AI Model Endpoint
- [ ] Create POST /models endpoint with JWT authentication
- [ ] Validate model_name and endpoint_url presence
- [ ] Create AIModel record
- [ ] Return created model with id, modelName, endpointUrl, createdAt
- [ ] Write unit tests for model registration

**Validates: Requirements 4.1**

### 5.2 Link Model to Project Endpoint
- [ ] Create POST /projects/:projectId/models endpoint with JWT authentication
- [ ] Validate projectId and modelId presence
- [ ] Verify project belongs to authenticated user
- [ ] Create ProjectModel association
- [ ] Return success response
- [ ] Write unit tests for model linking

**Validates: Requirements 4.2**

### 5.3 Property-Based Test: Model-Project Many-to-Many Relationship
- [ ] Write property test using fast-check to generate models linked to random projects
- [ ] Link model to M distinct projects
- [ ] Verify M entries exist in project_models junction table
- [ ] Verify model is retrievable from each linked project
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 5: Model-Project Many-to-Many Relationship"

**Validates: Requirements 4.3 (Property 5)**

## Phase 6: API Gateway - Evaluation Triggering

### 6.1 Evaluation Locking Logic
- [ ] Implement checkEvaluationLock() function
- [ ] Query latest evaluation for user_id and model_id combination
- [ ] Return true if latest evaluation status is IN_PROGRESS
- [ ] Return false otherwise
- [ ] Write unit tests for locking logic with various scenarios

**Validates: Requirements 5.1, 5.2**

### 6.2 Trigger Evaluation Endpoint
- [ ] Create POST /evaluations endpoint with JWT authentication
- [ ] Validate projectId and modelId presence
- [ ] Check evaluation lock using checkEvaluationLock()
- [ ] Return 409 Conflict if evaluation is IN_PROGRESS
- [ ] Create evaluation record with PENDING status
- [ ] Publish EvaluationJobMessage to Kafka topic
- [ ] Return created evaluation with id and status
- [ ] Write unit tests for evaluation triggering with lock scenarios

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### 6.3 Property-Based Test: Evaluation Locking Correctness
- [ ] Write property test using fast-check to generate evaluation scenarios
- [ ] Test scenario 1: Existing IN_PROGRESS evaluation returns 409 Conflict
- [ ] Test scenario 2: No IN_PROGRESS evaluation creates PENDING evaluation
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 6: Evaluation Locking Correctness"

**Validates: Requirements 5.2, 5.3 (Property 6)**

### 6.4 Property-Based Test: Kafka Message Integrity
- [ ] Write property test using fast-check to generate evaluation records
- [ ] Create evaluation with PENDING status
- [ ] Verify Kafka message published to "model-evaluation-jobs" topic
- [ ] Verify message contains evaluationId, userId, projectId, modelId matching evaluation
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 7: Kafka Message Integrity"

**Validates: Requirements 5.4, 5.5 (Property 7)**

## Phase 7: API Gateway - Evaluation Retrieval

### 7.1 Get Evaluation Endpoint
- [ ] Create GET /evaluations/:evaluationId endpoint with JWT authentication
- [ ] Query evaluation by ID
- [ ] Return 404 if evaluation not found
- [ ] Return evaluation with id, status, accuracy, precision, recall, f1_score, createdAt
- [ ] Return null for metric fields if status is PENDING or IN_PROGRESS
- [ ] Write unit tests for evaluation retrieval

**Validates: Requirements 8.1, 8.2, 8.3**

## Phase 8: Mock AI Service Implementation

### 8.1 FastAPI Mock Service
- [ ] Create FastAPI application with /predict endpoint
- [ ] Define PredictRequest model accepting input payload
- [ ] Define PredictResponse model with prediction (0 or 1) and confidence fields
- [ ] Implement mock prediction logic returning random 0 or 1
- [ ] Implement mock confidence logic returning "low", "medium", or "high"
- [ ] Add simulated response delay (e.g., 100-500ms)
- [ ] Write unit tests for /predict endpoint

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

## Phase 9: Trust Service - CSV and AI Client

### 9.1 CSV Loader Module
- [ ] Implement CSVLoader class
- [ ] Implement loadGroundTruth() method to read CSV file
- [ ] Parse CSV into GroundTruthRow array with input and expectedLabel fields
- [ ] Handle CSV file not found error
- [ ] Handle CSV parse errors
- [ ] Write unit tests for CSV loading with valid and invalid files

**Validates: Requirements 6.2, 9.3**

### 9.2 AI Model Client Module
- [ ] Implement AIModelClient class
- [ ] Implement predict() method to call external AI endpoint
- [ ] Send POST request with input payload
- [ ] Parse JSON response with prediction and confidence fields
- [ ] Handle network errors and timeouts
- [ ] Handle non-200 responses
- [ ] Handle invalid JSON responses
- [ ] Write unit tests for AI client with mock responses

**Validates: Requirements 6.3, 6.4, 9.1, 9.2**

## Phase 10: Trust Service - Metrics Computation

### 10.1 Metrics Calculator Module
- [ ] Implement MetricsCalculator class
- [ ] Implement compute() method accepting predictions and actuals arrays
- [ ] Calculate True Positives (TP), True Negatives (TN), False Positives (FP), False Negatives (FN)
- [ ] Calculate Accuracy as (TP + TN) / (TP + TN + FP + FN)
- [ ] Calculate Precision as TP / (TP + FP), return 0 if denominator is 0
- [ ] Calculate Recall as TP / (TP + FN), return 0 if denominator is 0
- [ ] Calculate F1 Score as 2 * (Precision * Recall) / (Precision + Recall), return 0 if denominator is 0
- [ ] Return PerformanceMetrics object with all computed values
- [ ] Write unit tests for metrics calculation with edge cases (all zeros, all ones, mixed)

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### 10.2 Property-Based Test: Metrics Computation Correctness
- [ ] Write property test using fast-check to generate prediction/label arrays
- [ ] Verify TP + TN + FP + FN equals total number of samples
- [ ] Verify Accuracy equals (TP + TN) / total
- [ ] Verify Precision equals TP / (TP + FP) when (TP + FP) > 0, else 0
- [ ] Verify Recall equals TP / (TP + FN) when (TP + FN) > 0, else 0
- [ ] Verify F1 Score equals 2 * (Precision * Recall) / (Precision + Recall) when (Precision + Recall) > 0, else 0
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 8: Metrics Computation Correctness"

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5 (Property 8)**

## Phase 11: Trust Service - Job Processing

### 11.1 Kafka Consumer Setup
- [ ] Implement Kafka consumer for "model-evaluation-jobs" topic
- [ ] Deserialize EvaluationJobMessage from Kafka
- [ ] Call processEvaluationJob() for each message
- [ ] Handle consumer errors and logging
- [ ] Write unit tests for consumer message handling

**Validates: Requirements 6.1**

### 11.2 Evaluation Job Processor
- [ ] Implement processEvaluationJob() method
- [ ] Update evaluation status to IN_PROGRESS
- [ ] Load ground truth CSV using CSVLoader
- [ ] Iterate through each ground truth row
- [ ] Call AIModelClient.predict() for each input
- [ ] Collect predictions and actual labels
- [ ] Compute metrics using MetricsCalculator
- [ ] Update evaluation record with accuracy, precision, recall, f1_score
- [ ] Update evaluation status to COMPLETED
- [ ] Handle errors and mark evaluation as FAILED
- [ ] Write unit tests for job processing with success and failure scenarios

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.6, 7.7**

### 11.3 Property-Based Test: Evaluation State Machine
- [ ] Write property test using fast-check to generate evaluation jobs
- [ ] Verify status transitions from PENDING to IN_PROGRESS upon job receipt
- [ ] Verify status transitions from IN_PROGRESS to COMPLETED upon successful metric computation
- [ ] Verify status transitions from IN_PROGRESS to FAILED upon any error
- [ ] Verify no other status transitions occur
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 9: Evaluation State Machine"

**Validates: Requirements 6.1, 7.6, 7.7 (Property 9)**

### 11.4 Property-Based Test: Failure Handling Without Retry
- [ ] Write property test using fast-check to generate failure scenarios
- [ ] Test scenario 1: API failure sets status to FAILED
- [ ] Test scenario 2: Invalid JSON sets status to FAILED
- [ ] Test scenario 3: CSV read failure sets status to FAILED
- [ ] Verify no retry attempts are made
- [ ] Verify FAILED status is persisted to database
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 10: Failure Handling Without Retry"

**Validates: Requirements 9.1, 9.4, 9.5 (Property 10)**

## Phase 12: Integration and End-to-End Testing

### 12.1 Property-Based Test: Evaluation History Preservation
- [ ] Write property test using fast-check to generate sequences of N evaluations
- [ ] Create N evaluations for user/model combination with various statuses
- [ ] Query evaluations for user/model
- [ ] Verify all N records are returned regardless of status
- [ ] Tag test: "Feature: ai-model-evaluation-platform, Property 11: Evaluation History Preservation"

**Validates: Requirements 11.6 (Property 11)**

### 12.2 End-to-End Integration Test
- [ ] Write integration test for complete evaluation flow
- [ ] Step 1: Register user via Auth Service
- [ ] Step 2: Login and obtain JWT token
- [ ] Step 3: Create project via API Gateway
- [ ] Step 4: Register AI model via API Gateway
- [ ] Step 5: Link model to project via API Gateway
- [ ] Step 6: Trigger evaluation via API Gateway
- [ ] Step 7: Verify Kafka message is consumed by Trust Service
- [ ] Step 8: Poll evaluation status until COMPLETED
- [ ] Step 9: Verify metrics are computed and persisted
- [ ] Step 10: Retrieve evaluation and verify all fields

**Validates: All Requirements (Integration)**

### 12.3 Error Handling Integration Tests
- [ ] Test duplicate email registration returns 409 Conflict
- [ ] Test invalid credentials return 401 Unauthorized
- [ ] Test missing JWT returns 401 Unauthorized
- [ ] Test USER role accessing SUPER_ADMIN endpoint returns 403 Forbidden
- [ ] Test triggering evaluation while IN_PROGRESS returns 409 Conflict
- [ ] Test CSV file not found marks evaluation as FAILED
- [ ] Test AI service unreachable marks evaluation as FAILED
- [ ] Test invalid AI response marks evaluation as FAILED

**Validates: Requirements 1.2, 1.4, 2.2, 2.3, 5.2, 9.1, 9.2, 9.3**

## Phase 13: Documentation and Deployment

### 13.1 Documentation
- [ ] Create README.md with project overview and architecture diagram
- [ ] Document API endpoints with request/response examples
- [ ] Document environment variables for each service
- [ ] Create setup instructions for local development
- [ ] Document ground truth CSV format requirements
- [ ] Create troubleshooting guide

### 13.2 Docker Deployment
- [ ] Create Dockerfile for api-gateway service
- [ ] Create Dockerfile for auth-service
- [ ] Create Dockerfile for trust-service
- [ ] Create Dockerfile for mock-ai-service
- [ ] Update docker-compose.yml with all service definitions
- [ ] Add health checks for all services
- [ ] Test full stack deployment with docker-compose up

### 13.3 Sample Data and Testing
- [ ] Create sample ground truth CSV file
- [ ] Create seed script for initial SUPER_ADMIN user
- [ ] Create Postman/Thunder Client collection for API testing
- [ ] Verify all endpoints work with sample data
