# Implementation Plan: Backend Todo API Service

**Branch**: `002-backend-todo-api` | **Date**: 2026-01-10 | **Spec**: [specs/002-backend-todo-api/spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-backend-todo-api/spec.md`

## Summary

Build a secure, multi-user backend service for the Phase II Todo application using FastAPI. The backend exposes JWT-protected REST APIs, persists data in Neon Serverless PostgreSQL, and strictly enforces user-level data isolation. JWT tokens issued by Better Auth on the frontend are verified using RS256 asymmetric algorithm with public key verification only.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, SQLModel, python-jose (JWT), asyncpg, uvicorn
**Storage**: Neon Serverless PostgreSQL (via asyncpg)
**Testing**: pytest, pytest-asyncio, httpx (for async test client)
**Target Platform**: Linux server (containerized deployment)
**Project Type**: Web application (backend component of monorepo)
**Performance Goals**: <2s response for task creation, <3s for list retrieval (up to 1000 tasks)
**Constraints**: <200ms p95 latency for simple operations, stateless authentication, 100 req/min per-user rate limit
**Scale/Scope**: Multi-user application with strict data isolation, no organization/tenant hierarchy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Monorepo Architecture | ✅ PASS | Backend resides in `/backend/` alongside frontend in same repository |
| II. JWT-Based Authentication | ✅ PASS | RS256 verification using public key; Authorization: Bearer header required |
| III. User Data Isolation | ✅ PASS | All queries filter by user_id from JWT; 404 returned for unauthorized access |
| IV. RESTful API Design | ✅ PASS | Resource-based URLs: `/api/users/{user_id}/tasks`, standard HTTP methods |
| V. Test-First Development | ✅ PASS | pytest with unit, integration, and contract tests planned |
| VI. Environment-Based Configuration | ✅ PASS | All secrets via env vars; .env.example documented |

**Note on Principle III**: Spec returns 404 (not 403) when accessing other users' tasks to prevent information leakage about task existence. This is a security-conscious deviation that aligns with the spirit of user data isolation.

**Note on Principle II**: Spec clarification updated to RS256 (asymmetric) instead of symmetric HMAC. Backend only needs public key for verification, enhancing security.

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-todo-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── create-task.yaml
│   ├── list-tasks.yaml
│   ├── get-task.yaml
│   ├── update-task.yaml
│   └── delete-task.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Environment configuration
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py          # SQLModel Task model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── task.py          # Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   └── task_service.py  # Business logic
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # Dependencies (auth, db session)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py    # Health check endpoints
│   │       └── tasks.py     # Task CRUD endpoints
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT verification middleware
│   │   ├── rate_limit.py    # Per-user rate limiting
│   │   └── cors.py          # CORS configuration
│   └── db/
│       ├── __init__.py
│       └── session.py       # Database session management
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # pytest fixtures
│   ├── contract/
│   │   └── test_api_contracts.py
│   ├── integration/
│   │   └── test_task_endpoints.py
│   └── unit/
│       ├── test_task_service.py
│       └── test_auth.py
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── .env.example
└── README.md

frontend/                    # Already implemented (Next.js)
└── [existing frontend code]
```

**Structure Decision**: Web application structure selected. Backend resides in `/backend/` directory with clear separation from existing `/frontend/`. This follows the monorepo architecture principle from the constitution.

## Complexity Tracking

> **No violations detected** - Plan complies with all constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
