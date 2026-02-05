# Quickstart: Backend Todo API Service

**Feature**: 002-backend-todo-api
**Date**: 2026-01-10
**Phase**: 1 (Design)

## Prerequisites

- Python 3.11+
- PostgreSQL 14+ (or Neon Serverless PostgreSQL account)
- Node.js 18+ (for frontend, already installed)
- Git

## Setup Steps

### 1. Clone and Navigate

```bash
cd /path/to/project
# You should already be in the monorepo root
```

### 2. Create Backend Directory Structure

```bash
mkdir -p backend/src/{models,schemas,services,api/routes,middleware,db}
mkdir -p backend/tests/{unit,integration,contract}
touch backend/src/__init__.py
touch backend/src/models/__init__.py
touch backend/src/schemas/__init__.py
touch backend/src/services/__init__.py
touch backend/src/api/__init__.py
touch backend/src/api/routes/__init__.py
touch backend/src/middleware/__init__.py
touch backend/src/db/__init__.py
touch backend/tests/__init__.py
```

### 3. Create Python Virtual Environment

```bash
cd backend
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 4. Install Dependencies

Create `backend/requirements.txt`:
```text
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
sqlmodel>=0.0.16
asyncpg>=0.29.0
python-jose[cryptography]>=3.3.0
slowapi>=0.1.9
pydantic-settings>=2.1.0
```

Create `backend/requirements-dev.txt`:
```text
-r requirements.txt
pytest>=8.0.0
pytest-asyncio>=0.23.0
httpx>=0.26.0
pytest-cov>=4.1.0
```

Install:
```bash
pip install -r requirements-dev.txt
```

### 5. Configure Environment Variables

Create `backend/.env.example`:
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database?sslmode=require

# JWT Authentication (RS256)
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhki...
-----END PUBLIC KEY-----"
JWT_ALGORITHM=RS256

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

Copy to `.env` and fill in actual values:
```bash
cp .env.example .env
# Edit .env with your values
```

### 6. Database Setup

#### Option A: Neon Serverless PostgreSQL (Recommended)
1. Create account at https://neon.tech
2. Create new project
3. Copy connection string to `DATABASE_URL` in `.env`

#### Option B: Local PostgreSQL
```bash
# Create database
createdb todo_api

# Update DATABASE_URL
DATABASE_URL=postgresql+asyncpg://localhost:5432/todo_api
```

### 7. Run Database Migration

Create initial migration:
```bash
# Copy migration from data-model.md to:
# backend/migrations/001_create_tasks_table.sql

# Run migration (using psql or Neon console)
psql $DATABASE_URL -f migrations/001_create_tasks_table.sql
```

### 8. Start Development Server

```bash
# From backend directory
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 9. Verify Installation

#### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

#### API Docs
Open in browser: http://localhost:8000/docs

## Project Structure After Setup

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Pydantic settings
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py          # SQLModel Task model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── task.py          # Request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   └── task_service.py  # Business logic
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # Dependency injection
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py
│   │       └── tasks.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT verification
│   │   ├── rate_limit.py    # Per-user rate limiting
│   │   └── cors.py          # CORS configuration
│   └── db/
│       ├── __init__.py
│       └── session.py       # Async session management
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
├── migrations/
│   └── 001_create_tasks_table.sql
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── .env.example
├── .env                     # Local only, gitignored
└── README.md
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=term-missing

# Run specific test category
pytest tests/unit/
pytest tests/integration/
pytest tests/contract/
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/users/{user_id}/tasks` | Create task |
| GET | `/api/v1/users/{user_id}/tasks` | List tasks |
| GET | `/api/v1/users/{user_id}/tasks/{id}` | Get task |
| PUT | `/api/v1/users/{user_id}/tasks/{id}` | Full update |
| PATCH | `/api/v1/users/{user_id}/tasks/{id}` | Partial update |
| DELETE | `/api/v1/users/{user_id}/tasks/{id}` | Delete task |

## Common Issues

### 1. JWT Public Key Format
Ensure the public key includes newlines. In `.env`:
```bash
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhki...\n-----END PUBLIC KEY-----"
```

### 2. Database Connection
- Neon: Ensure `?sslmode=require` in URL
- Local: Check PostgreSQL is running

### 3. CORS Errors
Verify `FRONTEND_URL` matches exactly (including port and protocol).

### 4. Rate Limiting
Default is 100 requests/minute per user. Adjust `RATE_LIMIT_PER_MINUTE` if needed.

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Follow tasks.md to implement in order
3. Run tests after each implementation step
4. Integrate with frontend after all tests pass
