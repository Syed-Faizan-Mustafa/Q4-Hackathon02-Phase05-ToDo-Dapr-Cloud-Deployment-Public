# Backend Todo API

RESTful API for Todo task management with JWT authentication, built with FastAPI.

## Features

- JWT RS256 token verification (stateless authentication)
- Complete CRUD operations for tasks
- User data isolation (users can only access their own tasks)
- Per-user rate limiting (100 requests/minute)
- CORS support for frontend integration
- Async PostgreSQL (Neon) with SQLModel ORM

## Requirements

- Python 3.11+
- PostgreSQL database (Neon recommended)

## Quick Start

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   # or: .venv\Scripts\activate  # Windows
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   # For development:
   pip install -r requirements-dev.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run database migration**
   ```bash
   # Apply migration to your PostgreSQL database
   psql $DATABASE_URL -f migrations/001_create_tasks_table.sql
   ```

5. **Start the server**
   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Verify health**
   ```bash
   curl http://localhost:8000/health
   # {"status":"ok","service":"backend-todo-api","version":"0.1.0"}
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| POST | `/api/v1/tasks` | Create a task |
| GET | `/api/v1/tasks` | List all tasks |
| GET | `/api/v1/tasks/{id}` | Get a task |
| PATCH | `/api/v1/tasks/{id}` | Update a task (partial) |
| PUT | `/api/v1/tasks/{id}` | Replace a task (full) |
| DELETE | `/api/v1/tasks/{id}` | Delete a task |

All `/api/v1/tasks` endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_PUBLIC_KEY` | RS256 public key for JWT verification | (required) |
| `JWT_ALGORITHM` | JWT signing algorithm | `RS256` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `RATE_LIMIT_PER_MINUTE` | Max requests per user per minute | `100` |
| `DEBUG` | Enable debug mode | `false` |

## Running Tests

```bash
# Run all tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test file
pytest tests/test_tasks.py -v
```

## API Documentation

When running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Project Structure

```
backend/
├── src/
│   ├── api/           # API routes and dependencies
│   ├── db/            # Database session management
│   ├── middleware/    # Auth, CORS, rate limiting
│   ├── models/        # SQLModel ORM models
│   ├── schemas/       # Pydantic response schemas
│   ├── services/      # Business logic
│   ├── config.py      # Settings management
│   └── main.py        # FastAPI application
├── tests/             # Pytest test files
├── migrations/        # SQL migration files
└── requirements.txt   # Python dependencies
```
