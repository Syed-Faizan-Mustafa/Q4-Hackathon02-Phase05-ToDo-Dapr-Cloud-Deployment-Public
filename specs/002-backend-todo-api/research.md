# Research: Backend Todo API Service

**Feature**: 002-backend-todo-api
**Date**: 2026-01-10
**Phase**: 0 (Research)

## Executive Summary

This document captures research findings for implementing the Backend Todo API Service using FastAPI, SQLModel, and Neon Serverless PostgreSQL with JWT authentication.

## Technology Research

### FastAPI Framework

**Version**: 0.109.x (latest stable)
**Why FastAPI**:
- Native async support for high-performance I/O operations
- Automatic OpenAPI documentation generation
- Pydantic integration for request/response validation
- Dependency injection system for clean architecture
- Native JWT middleware support

**Key Features Used**:
- `APIRouter` for modular endpoint organization
- `Depends()` for dependency injection (auth, db sessions)
- `HTTPException` for consistent error responses
- `BackgroundTasks` for potential async operations

### SQLModel ORM

**Version**: 0.0.16+ (latest stable)
**Why SQLModel**:
- Combines SQLAlchemy + Pydantic in single model definition
- Type-safe database queries
- Native async support with asyncpg
- Reduces boilerplate between database models and API schemas

**Integration Notes**:
- Use `SQLModel` base class for database models
- Separate `SQLModel` classes for request/response schemas (without `table=True`)
- Async session management via `AsyncSession`

### JWT Authentication (RS256)

**Library**: python-jose[cryptography]
**Algorithm**: RS256 (RSA Signature with SHA-256)

**Why RS256 over HS256**:
- Asymmetric: Backend only needs public key for verification
- Private key never leaves auth server (Better Auth)
- Enables token verification without sharing secrets
- Industry standard for distributed systems

**Implementation Approach**:
```python
from jose import jwt, JWTError
from jose.constants import ALGORITHMS

# Verify with public key only
payload = jwt.decode(
    token,
    public_key,
    algorithms=[ALGORITHMS.RS256],
    options={"verify_aud": False}
)
user_id = payload.get("sub")
```

**Environment Variables Required**:
- `JWT_PUBLIC_KEY`: PEM-encoded RSA public key for verification
- `JWT_ALGORITHM`: "RS256" (default)
- `JWT_ISSUER`: Expected issuer claim (optional validation)

### Neon Serverless PostgreSQL

**Connection**: asyncpg driver via SQLModel/SQLAlchemy async
**Connection String Format**: `postgresql+asyncpg://user:pass@host/db?sslmode=require`

**Neon-Specific Considerations**:
- Serverless cold starts: First query may have ~500ms latency
- Connection pooling: Use Neon's built-in pooler (port 5432 for session, 6543 for transaction)
- SSL required: Always use `sslmode=require`

**Recommended Settings**:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Handle connection drops
    pool_recycle=300     # Recycle connections every 5 min
)
```

### Rate Limiting

**Library**: slowapi (built on limits library)
**Strategy**: Per-user rate limiting using user_id from JWT

**Implementation**:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_user_id(request: Request) -> str:
    # Extract from JWT token in request state
    return request.state.user_id

limiter = Limiter(key_func=get_user_id)

@app.get("/tasks")
@limiter.limit("100/minute")
async def list_tasks(request: Request):
    ...
```

**Configuration**:
- Default: 100 requests/minute per user
- Configurable via `RATE_LIMIT_PER_MINUTE` environment variable
- Returns 429 Too Many Requests with `Retry-After` header

### CORS Configuration

**Library**: FastAPI CORSMiddleware (built-in)

**Implementation**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],  # Specific origin only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Security Notes**:
- Never use `allow_origins=["*"]` in production
- `allow_credentials=True` required for JWT in cookies (if used)
- Explicit methods and headers for security

## API Design Research

### URL Structure

Based on constitution principle IV (RESTful API Design):

```
Base URL: /api/v1

Endpoints:
POST   /api/v1/users/{user_id}/tasks          - Create task
GET    /api/v1/users/{user_id}/tasks          - List all tasks
GET    /api/v1/users/{user_id}/tasks/{id}     - Get single task
PUT    /api/v1/users/{user_id}/tasks/{id}     - Full update
PATCH  /api/v1/users/{user_id}/tasks/{id}     - Partial update
DELETE /api/v1/users/{user_id}/tasks/{id}     - Delete task

Health (no auth):
GET    /health                                 - Health check
GET    /health/ready                           - Readiness check
```

**User ID in Path Rationale**:
- Constitution III requires user_id in path for explicit authorization
- Enables defense-in-depth: path user_id must match JWT user_id
- Clear ownership semantics in URL structure

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Validation error, malformed request |
| 401 | Missing or invalid JWT token |
| 404 | Resource not found OR unauthorized access (prevents enumeration) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Error Response Format

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## Security Research

### JWT Token Structure (Better Auth)

Expected JWT payload from Better Auth:
```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "iat": 1704844800,
  "exp": 1705449600,
  "iss": "better-auth"
}
```

**Verification Steps**:
1. Extract token from `Authorization: Bearer <token>` header
2. Decode and verify signature using RS256 public key
3. Check `exp` claim for expiration
4. Extract `sub` claim as user_id
5. Compare path `{user_id}` with token `sub` claim

### Input Validation

**Title**: 1-255 characters, required
**Description**: 0-2000 characters, optional
**Completed**: boolean, optional (defaults to false)

**Validation Library**: Pydantic (via SQLModel)
```python
class TaskCreate(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
```

## Performance Research

### Expected Latencies

| Operation | Target p95 | Notes |
|-----------|------------|-------|
| Create task | <200ms | Single insert |
| List tasks | <500ms | Up to 1000 tasks, no pagination |
| Get task | <100ms | Single select with PK |
| Update task | <200ms | Single update with PK |
| Delete task | <100ms | Single delete with PK |

### Database Indexing Strategy

```sql
-- Primary key (automatic)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);  -- User isolation queries
CREATE INDEX idx_tasks_created_at ON tasks(user_id, created_at DESC);  -- Sorted listing
```

## Dependencies Summary

### Production Dependencies

```text
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
sqlmodel>=0.0.16
asyncpg>=0.29.0
python-jose[cryptography]>=3.3.0
slowapi>=0.1.9
pydantic-settings>=2.1.0
```

### Development Dependencies

```text
pytest>=8.0.0
pytest-asyncio>=0.23.0
httpx>=0.26.0
pytest-cov>=4.1.0
```

## Open Questions (Resolved)

| Question | Resolution | Source |
|----------|------------|--------|
| JWT algorithm? | RS256 (asymmetric) | Clarification session 2026-01-10 |
| Rate limiting strategy? | Per-user, 100 req/min | Clarification session 2026-01-10 |
| CORS policy? | Specific frontend origin via env var | Clarification session 2026-01-10 |

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [python-jose JWT Library](https://python-jose.readthedocs.io/)
- [Neon Serverless PostgreSQL](https://neon.tech/docs/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [slowapi Rate Limiting](https://slowapi.readthedocs.io/)
