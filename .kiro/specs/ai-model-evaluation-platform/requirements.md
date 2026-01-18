# Requirements Document

## Introduction

This document defines the requirements for an AI Model Evaluation Platform - a backend-only MVP that evaluates AI/LLM models asynchronously and stores their performance metrics. The platform connects to external AI models via REST APIs, triggers evaluations manually, and computes performance metrics (Accuracy, Precision, Recall, F1 Score) by comparing model predictions against ground truth data stored in CSV files.

## Glossary

- **API_Gateway**: The single public entry point that handles JWT validation, RBAC enforcement, request routing, and Kafka message production
- **Auth_Service**: Microservice responsible for user registration, login, password hashing, and JWT issuance
- **Trust_Service**: Microservice that consumes evaluation jobs from Kafka, calls external AI models, and computes performance metrics
- **Mock_AI_Service**: FastAPI-based service that simulates an AI model by returning mock predictions
- **Evaluation**: A single run of performance metric computation for a specific model against ground truth data
- **Ground_Truth**: CSV file containing input data and expected outputs for evaluation
- **Performance_Metrics**: Computed values including True Positives (TP), True Negatives (TN), False Positives (FP), False Negatives (FN), Accuracy, Precision, Recall, and F1 Score
- **RBAC**: Role-Based Access Control with two roles: SUPER_ADMIN and USER
- **Evaluation_Lock**: Mechanism preventing duplicate evaluations by checking database status

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to register and login to the platform, so that I can securely access evaluation features.

#### Acceptance Criteria

1. WHEN a user submits registration with email and password, THE Auth_Service SHALL create a new user with hashed password and USER role
2. WHEN a user submits registration with an existing email, THE Auth_Service SHALL reject the request with a conflict error
3. WHEN a user submits login with valid credentials, THE Auth_Service SHALL return a JWT access token
4. WHEN a user submits login with invalid credentials, THE Auth_Service SHALL reject the request with an unauthorized error
5. THE Auth_Service SHALL hash passwords using bcrypt before storage
6. THE Auth_Service SHALL generate JWT tokens containing user_id and role claims

### Requirement 2: Role-Based Access Control

**User Story:** As a platform administrator, I want to enforce role-based permissions, so that users can only access authorized resources.

#### Acceptance Criteria

1. THE API_Gateway SHALL validate JWT tokens on all protected endpoints
2. WHEN a request contains an invalid or expired JWT, THE API_Gateway SHALL reject the request with an unauthorized error
3. WHEN a USER role attempts to access SUPER_ADMIN-only endpoints, THE API_Gateway SHALL reject the request with a forbidden error
4. THE API_Gateway SHALL extract user_id and role from JWT for downstream service calls

### Requirement 3: Project Management

**User Story:** As a user, I want to create and view projects, so that I can organize my AI model evaluations.

#### Acceptance Criteria

1. WHEN a user creates a project with a name, THE API_Gateway SHALL persist the project linked to the user
2. WHEN a user requests their projects, THE API_Gateway SHALL return all projects owned by that user
3. THE System SHALL store project records with id, user_id, name, and created_at fields

### Requirement 4: AI Model Registration

**User Story:** As a user, I want to register AI models with their endpoints, so that I can evaluate them later.

#### Acceptance Criteria

1. WHEN a user registers an AI model with name and endpoint URL, THE API_Gateway SHALL persist the model record
2. WHEN a user links a model to a project, THE API_Gateway SHALL create a project-model association
3. THE System SHALL allow the same model to be linked to multiple projects
4. THE System SHALL store model records with id, model_name, endpoint_url, and created_at fields

### Requirement 5: Evaluation Triggering and Locking

**User Story:** As a user, I want to trigger model evaluations while preventing duplicate runs, so that I can evaluate models without wasting resources.

#### Acceptance Criteria

1. WHEN a user triggers an evaluation for a model, THE API_Gateway SHALL check the latest evaluation status for that user and model combination
2. IF the latest evaluation status is IN_PROGRESS, THEN THE API_Gateway SHALL reject the request with a conflict error indicating evaluation is already running
3. WHEN no blocking evaluation exists, THE API_Gateway SHALL create an evaluation record with PENDING status
4. WHEN an evaluation record is created, THE API_Gateway SHALL publish a job message to the Kafka topic "model-evaluation-jobs"
5. THE Kafka message SHALL contain evaluationId, userId, projectId, and modelId fields

### Requirement 6: Asynchronous Evaluation Processing

**User Story:** As a user, I want evaluations to run asynchronously, so that long-running evaluations do not block my workflow.

#### Acceptance Criteria

1. WHEN the Trust_Service receives an evaluation job from Kafka, THE Trust_Service SHALL update the evaluation status to IN_PROGRESS
2. THE Trust_Service SHALL load ground truth data from the configured CSV file
3. FOR EACH row in the ground truth CSV, THE Trust_Service SHALL call the Mock_AI_Service endpoint with the input data
4. THE Mock_AI_Service SHALL return a JSON response with prediction and confidence fields
5. THE Trust_Service SHALL parse the AI response and compare predictions against ground truth labels

### Requirement 7: Performance Metrics Computation

**User Story:** As a user, I want to see performance metrics for my model evaluations, so that I can assess model quality.

#### Acceptance Criteria

1. THE Trust_Service SHALL compute True Positives (TP), True Negatives (TN), False Positives (FP), and False Negatives (FN) from predictions
2. THE Trust_Service SHALL compute Accuracy as (TP + TN) / (TP + TN + FP + FN)
3. THE Trust_Service SHALL compute Precision as TP / (TP + FP), handling division by zero
4. THE Trust_Service SHALL compute Recall as TP / (TP + FN), handling division by zero
5. THE Trust_Service SHALL compute F1 Score as 2 * (Precision * Recall) / (Precision + Recall), handling division by zero
6. WHEN all metrics are computed successfully, THE Trust_Service SHALL persist accuracy, precision, recall, and f1_score to the evaluation record
7. WHEN metrics are persisted, THE Trust_Service SHALL update the evaluation status to COMPLETED

### Requirement 8: Evaluation Result Retrieval

**User Story:** As a user, I want to retrieve evaluation results, so that I can review model performance.

#### Acceptance Criteria

1. WHEN a user requests an evaluation by ID, THE API_Gateway SHALL return the evaluation record with status and metrics
2. THE evaluation response SHALL include id, status, accuracy, precision, recall, f1_score, and created_at fields
3. IF the evaluation status is PENDING or IN_PROGRESS, THEN THE response SHALL include null values for metric fields

### Requirement 9: Failure Handling

**User Story:** As a user, I want failed evaluations to be recorded, so that I can identify and troubleshoot issues.

#### Acceptance Criteria

1. IF the Mock_AI_Service call fails, THEN THE Trust_Service SHALL mark the evaluation as FAILED
2. IF the Mock_AI_Service returns invalid JSON, THEN THE Trust_Service SHALL mark the evaluation as FAILED
3. IF the ground truth CSV cannot be read, THEN THE Trust_Service SHALL mark the evaluation as FAILED
4. WHEN an evaluation fails, THE Trust_Service SHALL NOT retry the evaluation
5. WHEN an evaluation fails, THE Trust_Service SHALL persist the FAILED status to the database

### Requirement 10: Mock AI Service

**User Story:** As a developer, I want a mock AI service for testing, so that I can develop and test the platform without external dependencies.

#### Acceptance Criteria

1. THE Mock_AI_Service SHALL accept POST requests with input payload
2. THE Mock_AI_Service SHALL return JSON response in format: { "prediction": number, "confidence": string }
3. THE Mock_AI_Service SHALL NOT require authentication
4. THE Mock_AI_Service SHALL simulate realistic response times

### Requirement 11: Database Schema

**User Story:** As a developer, I want a well-defined database schema, so that data is stored consistently and relationships are maintained.

#### Acceptance Criteria

1. THE System SHALL store users with id, email, password_hash, role (SUPER_ADMIN or USER), and created_at
2. THE System SHALL store projects with id, user_id (foreign key), name, and created_at
3. THE System SHALL store ai_models with id, model_name, endpoint_url, and created_at
4. THE System SHALL store project_models as a many-to-many relationship with project_id and model_id foreign keys
5. THE System SHALL store evaluations with id, user_id, project_id, model_id, status (PENDING, IN_PROGRESS, COMPLETED, FAILED), accuracy, precision, recall, f1_score, and created_at
6. THE System SHALL preserve all evaluation history records
