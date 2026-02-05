# Tasks: Backend Todo API Service

**Input**: Design documents from `/specs/002-backend-todo-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Branch**: `002-backend-todo-api`
**Generated**: 2026-01-10

**Tests**: Constitution principle V (Test-First Development) applies. Tests included per spec requirement.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md, this is a monorepo web application:
- Backend source: `backend/src/`
- Backend tests: `backend/tests/`
- Frontend: `frontend/` (already implemented)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create Python project structure and install dependencies

- [x] T001 Create backend directory structure per plan.md: `backend/src/{models,schemas,services,api/routes,middleware,db}` and `backend/tests/{unit,integration,contract}`
- [x] T002 Create `backend/pyproject.toml` with Python 3.11+ configuration and project metadata
- [x] T003 [P] Create `backend/requirements.txt` with production dependencies (fastapi, uvicorn, sqlmodel, asyncpg, python-jose, slowapi, pydantic-settings)
- [x] T004 [P] Create `backend/requirements-dev.txt` with dev dependencies (pytest, pytest-asyncio, httpx, pytest-cov)
- [x] T005 [P] Create `backend/.env.example` with all required environment variables (DATABASE_URL, JWT_PUBLIC_KEY, JWT_ALGORITHM, FRONTEND_URL, RATE_LIMIT_PER_MINUTE, HOST, PORT, DEBUG)
- [x] T006 Create all `__init__.py` files in backend/src/ subdirectories
- [x] T007 Create `backend/src/config.py` with Pydantic Settings for environment configuration

**Checkpoint**: Project structure ready for development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

### Database Layer

- [x] T008 Create `backend/src/db/__init__.py` with database module exports
- [x] T009 Create `backend/src/db/session.py` with async SQLModel engine and session management for Neon PostgreSQL
- [x] T010 Create `backend/migrations/001_create_tasks_table.sql` with schema from data-model.md

### Model Layer

- [x] T011 Create `backend/src/models/__init__.py` with model exports
- [x] T012 Create `backend/src/models/task.py` with Task, TaskBase, TaskCreate, TaskUpdate, TaskRead SQLModel classes per data-model.md

### Schema Layer

- [x] T013 Create `backend/src/schemas/__init__.py` with schema exports
- [x] T014 Create `backend/src/schemas/error.py` with ErrorResponse and ValidationError Pydantic models

### Middleware Layer (US5 - Token Verification is foundational)

- [x] T015 Create `backend/src/middleware/__init__.py` with middleware exports
- [x] T016 Create `backend/src/middleware/auth.py` with JWT RS256 verification middleware using python-jose (FR-001, FR-002, FR-003)
- [x] T017 Create `backend/src/middleware/rate_limit.py` with per-user rate limiting using slowapi (100 req/min per FR-030, FR-031)
- [x] T018 Create `backend/src/middleware/cors.py` with CORS configuration for specific frontend origin (FR-032, FR-033)

### API Infrastructure

- [x] T019 Create `backend/src/api/__init__.py` with API module exports
- [x] T020 Create `backend/src/api/deps.py` with dependency injection for database session and current user extraction
- [x] T021 Create `backend/src/api/routes.py` with router registration
- [x] T022 Create `backend/src/api/health.py` with GET /health endpoint (no auth required)

### Application Entry Point

- [x] T023 Create `backend/src/main.py` with FastAPI application, middleware registration, and router includes

### Test Infrastructure

- [x] T024 Create `backend/tests/__init__.py` for test package
- [x] T025 Create `backend/tests/conftest.py` with pytest fixtures (async client, test database, mock JWT tokens)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 5 - Token Verification (Priority: P1)

**Goal**: Verify JWT tokens for all protected operations so only authenticated users can access their data

**Independent Test**: Attempt operations with valid tokens, invalid tokens, expired tokens, and missing tokens

**Note**: This is implemented in Phase 2 as foundational middleware, but tests are here for story traceability

### Tests for User Story 5

- [x] T026 [P] [US5] Create `backend/tests/test_auth.py` with tests for JWT verification (valid, expired, invalid, missing tokens)
- [x] T027 [P] [US5] Tests integrated - auth middleware tested on protected endpoints

**Checkpoint**: Authentication middleware fully tested and operational

---

## Phase 4: User Story 1 - Create Task (Priority: P1) MVP

**Goal**: Authenticated users can create new tasks with title and optional description

**Independent Test**: Send authenticated POST request with task data, verify task persisted and returned with unique ID

### Tests for User Story 1

- [x] T028 [P] [US1] Create `backend/tests/test_tasks.py` with tests for POST /api/v1/tasks
- [x] T029 [P] [US1] Integration tests included in test_tasks.py

### Implementation for User Story 1

- [x] T030 Create `backend/src/services/__init__.py` with service exports
- [x] T031 [US1] Create `backend/src/services/task_service.py` with TaskService.create_task() method (FR-005, FR-006, FR-007, FR-008, FR-009)
- [x] T032 [US1] Create `backend/src/api/tasks.py` with POST /api/v1/tasks endpoint (using JWT user_id from auth)
- [x] T033 [US1] Input validation in SQLModel TaskCreate (title 1-255 chars, description max 2000 chars)
- [x] T034 [US1] User ID extracted from JWT sub claim via auth middleware

**Checkpoint**: Task creation fully functional - can create tasks via API

---

## Phase 5: User Story 2 - View Tasks (Priority: P1)

**Goal**: Authenticated users can view all their tasks and individual task details

**Independent Test**: Authenticate and request task list, verify only user's tasks returned sorted by creation date

### Tests for User Story 2

- [x] T035-T037 [P] [US2] Tests for list and get tasks in `backend/tests/test_tasks.py`

### Implementation for User Story 2

- [x] T038 [US2] TaskService.get_tasks(user_id) method in `backend/src/services/task_service.py` (FR-012, FR-013)
- [x] T039 [US2] TaskService.get_task(user_id, task_id) method in `backend/src/services/task_service.py` (FR-014)
- [x] T040 [US2] GET /api/v1/tasks endpoint in `backend/src/api/tasks.py`
- [x] T041 [US2] GET /api/v1/tasks/{task_id} endpoint in `backend/src/api/tasks.py`
- [x] T042 [US2] Task list returns all properties (FR-015) sorted by created_at DESC

**Checkpoint**: Task listing and retrieval functional - MVP complete (create + read)

---

## Phase 6: User Story 3 - Update Task (Priority: P2)

**Goal**: Authenticated users can update task details and mark tasks as complete

**Independent Test**: Create task, send update request, verify changes persisted with new updated_at timestamp

### Tests for User Story 3

- [x] T043-T044 [P] [US3] Tests for update tasks in `backend/tests/test_tasks.py`

### Implementation for User Story 3

- [x] T045 [US3] TaskService.update_task(user_id, task_id, data) method in `backend/src/services/task_service.py` (FR-016, FR-017, FR-019)
- [x] T046 [US3] PUT /api/v1/tasks/{task_id} endpoint in `backend/src/api/tasks.py` for full update
- [x] T047 [US3] PATCH /api/v1/tasks/{task_id} endpoint in `backend/src/api/tasks.py` for partial update
- [x] T048 [US3] 404 returned when updating non-owned or non-existent task (FR-018)

**Checkpoint**: Task updates functional - can modify and complete tasks

---

## Phase 7: User Story 4 - Delete Task (Priority: P2)

**Goal**: Authenticated users can permanently delete tasks they own

**Independent Test**: Create task, delete it, verify it no longer appears in task list

### Tests for User Story 4

- [x] T049-T050 [P] [US4] Tests for delete tasks in `backend/tests/test_tasks.py`

### Implementation for User Story 4

- [x] T051 [US4] TaskService.delete_task(user_id, task_id) method in `backend/src/services/task_service.py` (FR-020, FR-022)
- [x] T052 [US4] DELETE /api/v1/tasks/{task_id} endpoint in `backend/src/api/tasks.py`
- [x] T053 [US4] 404 returned when deleting non-owned or non-existent task (FR-021)

**Checkpoint**: All CRUD operations complete - full task management functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, documentation, and final validation

### Error Handling & Validation

- [x] T054 [P] Error handling built into service layer with TaskNotFoundError
- [x] T055 [P] All endpoints return appropriate HTTP status codes per FR-026 (200, 201, 204, 400, 401, 404, 429, 500)
- [x] T056 [P] All responses are JSON format with descriptive error messages (FR-027, FR-028)

### Unit Tests

- [x] T057 [P] Tests for TaskService included in `backend/tests/test_tasks.py`
- [x] T058 [P] Rate limiting configured via middleware with slowapi

### Documentation & Validation

- [x] T059 Create `backend/README.md` with setup instructions and API overview
- [ ] T060 Validate backend against quickstart.md steps (virtual env, install, run, health check)
- [ ] T061 Run full test suite and ensure all tests pass

**Checkpoint**: Backend complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US5 Tests)**: Depends on Phase 2 - tests foundational auth
- **Phase 4 (US1)**: Depends on Phase 2 - can run parallel with Phase 3
- **Phase 5 (US2)**: Depends on Phase 4 (needs create to test list)
- **Phase 6 (US3)**: Depends on Phase 4 (needs create to test update)
- **Phase 7 (US4)**: Depends on Phase 4 (needs create to test delete)
- **Phase 8 (Polish)**: Depends on Phases 3-7 completion

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US5 (Auth) | P1 | Foundational | - (is foundational) |
| US1 (Create) | P1 | Foundational | US5 tests |
| US2 (Read) | P1 | US1 (needs tasks) | US3, US4 |
| US3 (Update) | P2 | US1 (needs tasks) | US2, US4 |
| US4 (Delete) | P2 | US1 (needs tasks) | US2, US3 |

### Within Each User Story

1. Tests written FIRST and FAIL before implementation
2. Service methods before API endpoints
3. Core implementation before validation/error handling

---

## Parallel Opportunities

### Phase 1 Parallel Tasks
```
T003, T004, T005 can run in parallel (different files)
```

### Phase 2 Parallel Tasks
```
T016, T017, T018 can run in parallel (different middleware files)
```

### Test Parallelization per Story
```
# US5 tests:
T026, T027 in parallel

# US1 tests:
T028, T029 in parallel

# US2 tests:
T035, T036, T037 in parallel

# US3 tests:
T043, T044 in parallel

# US4 tests:
T049, T050 in parallel
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (includes US5 auth)
3. Complete Phase 3: US5 auth tests
4. Complete Phase 4: US1 Create Task
5. Complete Phase 5: US2 View Tasks
6. **STOP and VALIDATE**: Test create + list operations
7. Deploy/demo MVP (users can create and view tasks)

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 + US2 = Create & View tasks
2. **Iteration 2**: Add US3 = Update/complete tasks
3. **Iteration 3**: Add US4 = Delete tasks
4. **Final**: Polish phase = Error handling, docs, full test coverage

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | T001-T007 (7) | Project Setup |
| Phase 2 | T008-T025 (18) | Foundational Infrastructure |
| Phase 3 | T026-T027 (2) | US5 Auth Tests |
| Phase 4 | T028-T034 (7) | US1 Create Task |
| Phase 5 | T035-T042 (8) | US2 View Tasks |
| Phase 6 | T043-T048 (6) | US3 Update Task |
| Phase 7 | T049-T053 (5) | US4 Delete Task |
| Phase 8 | T054-T061 (8) | Polish & Validation |
| **Total** | **61 tasks** | |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at MVP checkpoint (after Phase 5) for early validation
