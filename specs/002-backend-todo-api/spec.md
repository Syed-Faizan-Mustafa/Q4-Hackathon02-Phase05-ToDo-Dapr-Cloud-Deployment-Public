# Feature Specification: Backend Todo API Service

**Feature Branch**: `002-backend-todo-api`
**Created**: 2026-01-10
**Status**: Draft
**Input**: User description: "Backend service for Phase II Todo application with FastAPI, JWT authentication, PostgreSQL, user isolation, and REST API endpoints for task CRUD operations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated User Creates a Task (Priority: P1)

As an authenticated user, I want to create a new task so that I can track my to-do items.

**Why this priority**: Task creation is the core functionality of the Todo application. Without it, users cannot use the system at all. This is the MVP feature.

**Independent Test**: Can be fully tested by sending an authenticated POST request with task data and verifying the task is persisted and returned with a unique identifier.

**Acceptance Scenarios**:

1. **Given** a user is authenticated with a valid JWT token, **When** they send a request to create a task with a title and optional description, **Then** the system creates the task, associates it with the user, and returns the created task with a unique ID and timestamps.

2. **Given** a user is authenticated with a valid JWT token, **When** they send a request to create a task without a title, **Then** the system returns a validation error indicating title is required.

3. **Given** a user provides an invalid or expired JWT token, **When** they attempt to create a task, **Then** the system returns an authentication error and does not create any task.

---

### User Story 2 - Authenticated User Views Their Tasks (Priority: P1)

As an authenticated user, I want to view all my tasks so that I can see what I need to accomplish.

**Why this priority**: Viewing tasks is equally critical to creating them - users need to see their task list to use the application effectively.

**Independent Test**: Can be fully tested by authenticating and requesting the task list, then verifying only the authenticated user's tasks are returned.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and has created tasks, **When** they request their task list, **Then** the system returns only tasks belonging to that user, not tasks from other users.

2. **Given** a user is authenticated and has no tasks, **When** they request their task list, **Then** the system returns an empty list.

3. **Given** a user is authenticated, **When** they request their task list, **Then** tasks are returned with all properties including ID, title, description, completion status, and timestamps.

---

### User Story 3 - Authenticated User Updates a Task (Priority: P2)

As an authenticated user, I want to update my existing tasks so that I can modify task details or mark them as complete.

**Why this priority**: Updating tasks (especially marking complete) is essential for task management but depends on tasks existing first.

**Independent Test**: Can be fully tested by creating a task, then sending an update request and verifying the changes are persisted.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and owns a task, **When** they send a request to update the task's title or description, **Then** the system updates the task and returns the updated task with a new updated timestamp.

2. **Given** a user is authenticated and owns a task, **When** they send a request to mark the task as complete, **Then** the system updates the completion status and returns the updated task.

3. **Given** a user is authenticated, **When** they attempt to update a task belonging to another user, **Then** the system returns a not found error (to prevent information leakage about other users' tasks).

4. **Given** a user is authenticated, **When** they attempt to update a non-existent task, **Then** the system returns a not found error.

---

### User Story 4 - Authenticated User Deletes a Task (Priority: P2)

As an authenticated user, I want to delete tasks I no longer need so that I can keep my task list clean.

**Why this priority**: Deletion is important for task management but is secondary to core CRUD operations.

**Independent Test**: Can be fully tested by creating a task, deleting it, and verifying it no longer appears in the task list.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and owns a task, **When** they send a request to delete the task, **Then** the system permanently removes the task and confirms the deletion.

2. **Given** a user is authenticated, **When** they attempt to delete a task belonging to another user, **Then** the system returns a not found error (to prevent information leakage).

3. **Given** a user is authenticated, **When** they attempt to delete a non-existent task, **Then** the system returns a not found error.

---

### User Story 5 - Token Verification for All Operations (Priority: P1)

As the system, I need to verify JWT tokens for all protected operations so that only authenticated users can access their data.

**Why this priority**: Security is fundamental - without proper authentication, user data isolation cannot be enforced.

**Independent Test**: Can be fully tested by attempting operations with valid tokens, invalid tokens, expired tokens, and missing tokens.

**Acceptance Scenarios**:

1. **Given** a request with a valid, non-expired JWT token, **When** the system processes the request, **Then** the user identity is extracted from the token and used for the operation.

2. **Given** a request with an expired JWT token, **When** the system processes the request, **Then** the system rejects the request with an authentication error.

3. **Given** a request without a JWT token, **When** the system processes any protected endpoint, **Then** the system rejects the request with an authentication error.

4. **Given** a request with a malformed JWT token, **When** the system processes the request, **Then** the system rejects the request with an authentication error.

---

### Edge Cases

- What happens when a user sends a task title exceeding maximum length? System returns validation error with maximum length specified.
- What happens when a user sends an empty request body? System returns validation error listing required fields.
- How does system handle database connection failures? System returns a service unavailable error with appropriate messaging.
- What happens when concurrent requests try to modify the same task? Last write wins; system maintains data consistency through database transactions.
- How does system handle requests with valid JWT but user no longer exists? System returns authentication error.

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization
- **FR-001**: System MUST verify JWT tokens on all protected endpoints before processing requests
- **FR-002**: System MUST extract user identity from the JWT token payload (user ID claim)
- **FR-003**: System MUST reject requests with missing, invalid, or expired JWT tokens with a 401 Unauthorized response
- **FR-004**: System MUST NOT store or manage user sessions (stateless authentication)

#### Task Management - Create
- **FR-005**: System MUST allow authenticated users to create tasks with a title (required) and description (optional)
- **FR-006**: System MUST automatically associate new tasks with the authenticated user's ID
- **FR-007**: System MUST generate a unique identifier for each task
- **FR-008**: System MUST record creation timestamp when a task is created
- **FR-009**: System MUST set new tasks to incomplete status by default
- **FR-010**: System MUST validate that task title is between 1 and 255 characters
- **FR-011**: System MUST validate that task description does not exceed 2000 characters if provided

#### Task Management - Read
- **FR-012**: System MUST allow authenticated users to retrieve a list of their own tasks
- **FR-013**: System MUST return only tasks belonging to the authenticated user (strict user isolation)
- **FR-014**: System MUST allow authenticated users to retrieve a single task by ID (if owned by them)
- **FR-015**: System MUST return task data including: ID, title, description, completion status, created timestamp, and updated timestamp

#### Task Management - Update
- **FR-016**: System MUST allow authenticated users to update their own tasks (title, description, completion status)
- **FR-017**: System MUST update the "updated timestamp" when any task field is modified
- **FR-018**: System MUST return 404 Not Found when user attempts to update a task they don't own
- **FR-019**: System MUST support partial updates (user can update only specific fields)

#### Task Management - Delete
- **FR-020**: System MUST allow authenticated users to delete their own tasks
- **FR-021**: System MUST return 404 Not Found when user attempts to delete a task they don't own
- **FR-022**: System MUST permanently remove deleted tasks from the database

#### Data Persistence
- **FR-023**: System MUST persist all task data to a PostgreSQL database
- **FR-024**: System MUST ensure data integrity through database constraints and transactions
- **FR-025**: System MUST handle database connection failures gracefully with appropriate error responses

#### API Behavior
- **FR-026**: System MUST return appropriate HTTP status codes (200, 201, 400, 401, 404, 429, 500)
- **FR-027**: System MUST return responses in JSON format
- **FR-028**: System MUST include descriptive error messages in error responses
- **FR-029**: System MUST validate all input data before processing
- **FR-030**: System MUST enforce per-user rate limiting of 100 requests per minute
- **FR-031**: System MUST return 429 Too Many Requests when rate limit is exceeded
- **FR-032**: System MUST implement CORS allowing only the configured frontend origin (via environment variable)
- **FR-033**: System MUST reject cross-origin requests from non-allowed origins

### Key Entities

- **Task**: Represents a to-do item owned by a user. Contains: unique identifier, owner reference (user ID), title, optional description, completion status, creation timestamp, and last updated timestamp.

- **User**: Referenced by user ID from JWT token. The backend does not manage user records directly - user authentication is handled by the frontend's Better Auth system. The backend only stores the user ID reference in tasks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can create a task and receive confirmation within 2 seconds under normal load
- **SC-002**: Authenticated users can retrieve their complete task list within 3 seconds for up to 1000 tasks
- **SC-003**: 100% of requests without valid authentication are rejected (no unauthorized data access)
- **SC-004**: Users can only see, modify, and delete their own tasks (complete data isolation verified)
- **SC-005**: All CRUD operations maintain data consistency - no partial updates or orphaned records
- **SC-006**: System returns meaningful error messages for all validation failures
- **SC-007**: 99% of valid API requests complete successfully under normal operating conditions
- **SC-008**: System handles malformed requests gracefully without crashing or exposing internal errors

## Clarifications

### Session 2026-01-10

- Q: Which JWT signing algorithm should the backend support for token verification? → A: RS256 (asymmetric) - public key verification only on backend
- Q: Should the API implement rate limiting? → A: Per-user rate limiting (100 requests/minute)
- Q: What CORS policy should the backend implement? → A: Allow specific frontend origin only (configured via env var)

## Assumptions

1. **JWT Token Format**: JWT tokens are issued by Better Auth on the frontend and contain a standard `sub` (subject) claim with the user ID.
2. **JWT Signing**: The backend will verify JWT signatures using RS256 asymmetric algorithm with a public key configured via environment variables (private key remains on frontend/auth server only).
3. **Database Schema**: The backend will create/manage its own tasks table; no existing task schema exists.
4. **User Management**: User registration, login, and session management are handled entirely by the frontend; the backend only verifies tokens.
5. **Single-Tenant**: This is a multi-user application where each user has isolated data, but there is no organization/tenant hierarchy.
6. **No Pagination Initially**: Task list retrieval returns all user tasks; pagination can be added in future iterations if needed.
7. **No Task Ordering**: Tasks are returned in creation order (newest first) by default.
8. **No Soft Delete**: Deleted tasks are permanently removed, not soft-deleted.
