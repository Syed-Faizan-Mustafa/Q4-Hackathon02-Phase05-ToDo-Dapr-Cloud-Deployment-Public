"""Pytest fixtures and configuration for API testing.

Provides async test client, database session, and JWT token mocking.
"""

import os
from datetime import datetime, timedelta
from typing import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.api.deps import get_db
from src.config import get_settings
from src.main import app


# Test database URL (SQLite for isolated testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Test JWT keys for token generation
# In production, these would be proper RSA keys
TEST_JWT_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MlMxMmHbLTjyGpR0
cwuT6uGxPNIARF1BKdBDxFlBVBCepMYv+vLH1e0wKOH5XUXPhXzEsM8T4n1xtLwe
qeMXEqmNB9jTt3wvbNQYdaYC5V1k1x5J8yXw5bL5qOV9bRFqLqH5w5zLxHLhWLaU
D+FG6Mn8V5yXq9qkCl5GgKb4hLqkOFt0TMdBt/dTAGY/0dbANb18xzNmQydfaWwV
d+l9xrcNwWdVhI5PmKHN5Xl5Fh0lFrMxJZ1oGdlb0wX+hH0hGMYaB3EVg3u5IZOG
1XEqL1HnB0zgfZQh5HYfMTdNcPf2t6fzSwIDAQABAoIBAQCDLqF2dGBV9CkKuaYx
p3I3WHl7NYU7pLwG9KHBMv1VvGkP4DjU7dFPfTsNNDSqLGV8N9Oa8zVy3yLqfIHN
G5JNwCbr3qAqGQw1k5mZ3ESRYmN3tLoGpY1V5sSj6N3G0RVRfMi1F8K9R9kzPDXf
dNWXFqYI0dMVNw0s9fjA3G9r8CJI0lJrN2N3iLdlB3T2JDh7NnJeBNLdNI8NjmYV
0Z6R9b7TzLHnkWPB3aLnmHN5/Hnz9dFZGKvv5f1n0VCvo7iN3h0vNF3s6RlBBGpi
jDHbR6bV8VoG3YsP1JfZwQH3dHAGmWBzGaGQiwEjwLQiPdo2T+hN3hGmPhj3UqEq
D/PhAoGBAPAJLhvnU8vbXbz+13wH0QV0hM3HlEH3z7aSzUHZ1c4n3kd7F0dswHN9
vRl3r0GrAF2s0G6rlp0B0SYPkHLfK/5cKzMfqZL8RHPVY+D0dKZgPfT1O/dFgBKy
nJAYd0wQwC+G8a3rPwUz8v0TYaJ7t0MTwFBiJQB4C5wvqLbaLZLzAoGBAOAE0GRB
F/4F5GRp2z8nv9Q4qEU9F5qVFsqM8V6/wrLP5Nf3UXc3GNlgKz3b0TpKQN3y9j8q
JXM5dGBJZSf2zEuhJZ5q2FNvbJCYv0GVp1aQKhzr8Z3LJVYs0Py5qlVhPSQHXsHV
J/v7CcZFXqCh1WYwwTsMnG1UC5pK3L1GdNrJAoGBALPNVpwBJZwTJQ0WgXVHLbMN
yjR5HZ5K3L1Dc0oA4/LFp1c7N5HHkXr0+U7jXTq7K8aPwq5J0cvGGJRc6c8xaVLR
+L2tDh8o7K5d7E3k9qAqHHH1pLr8Pb6lB1qG0yKm1Y5dIOQp1jwN1cqV+FdYZIh/
d3u3i5r7ZPvNG3Z7d3S7AoGAd0rZMfL6bGHqTb6sIZHc2A0+bKSkMf/ELKRVpJpc
fmQCvF6J0Hm2R0ZLGg7P0f3ByKvS+HrLJZ0eO/j7rvKXl1r1C/3GN5YlQGPR0bPR
VYNqfjBH1n4NfY5L0d5CQKwRPdC0Y1M6S0LmQr9S7F8S5R/3f4fWJJc9MnD+N4GN
YukCgYAXR/kVMnzJLq8EJr1naPq3sg7WXDJ0XKqMefxFx0sSk8p6pNoF5XfE0a6Q
lGJCQwPAhEW0S7p0D+br4FcBCuQcC5jUBk5dLPdCvnGJ0NzLQh1+k0q8EhfR3f5u
hRb5VDqYNHFhFhA0E3JAZz5KPj5DTAO3N5nQq4GXZBqCYdDkgw==
-----END RSA PRIVATE KEY-----"""

TEST_JWT_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWy
F8PbnGy0AHB7MlMxMmHbLTjyGpR0cwuT6uGxPNIARF1BKdBDxFlBVBCepMYv+vLH
1e0wKOH5XUXPhXzEsM8T4n1xtLweqeMXEqmNB9jTt3wvbNQYdaYC5V1k1x5J8yXw
5bL5qOV9bRFqLqH5w5zLxHLhWLaUD+FG6Mn8V5yXq9qkCl5GgKb4hLqkOFt0TMdB
t/dTAGY/0dbANb18xzNmQydfaWwVd+l9xrcNwWdVhI5PmKHN5Xl5Fh0lFrMxJZ1o
GdlbwX+hH0hGMYaB3EVg3u5IZOG1XEqL1HnB0zgfZQh5HYfMTdNcPf2t6fzSwIDA
QIDAQAB
-----END PUBLIC KEY-----"""


@pytest.fixture(scope="session")
def anyio_backend():
    """Use asyncio backend for pytest-anyio."""
    return "asyncio"


@pytest_asyncio.fixture
async def test_engine():
    """Create async test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session_maker = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client with overridden dependencies."""
    # Override settings to use test public key
    os.environ["JWT_PUBLIC_KEY"] = TEST_JWT_PUBLIC_KEY
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL.replace("+aiosqlite", "")
    os.environ["FRONTEND_URL"] = "http://localhost:3000"

    # Override database dependency
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


def create_test_token(
    user_id: str = None,
    expired: bool = False,
    invalid: bool = False,
) -> str:
    """Generate JWT token for testing.

    Args:
        user_id: User ID for token (generates UUID if not provided)
        expired: If True, creates an expired token
        invalid: If True, creates a malformed token

    Returns:
        str: JWT token string
    """
    if invalid:
        return "invalid.token.string"

    if user_id is None:
        user_id = str(uuid4())

    now = datetime.utcnow()
    if expired:
        exp = now - timedelta(hours=1)
    else:
        exp = now + timedelta(hours=1)

    payload = {
        "sub": user_id,
        "iat": now,
        "exp": exp,
    }

    return jwt.encode(payload, TEST_JWT_PRIVATE_KEY, algorithm="RS256")


@pytest.fixture
def test_user_id() -> str:
    """Generate a test user ID."""
    return str(uuid4())


@pytest.fixture
def auth_headers(test_user_id: str) -> dict:
    """Create authorization headers with valid JWT."""
    token = create_test_token(user_id=test_user_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def expired_auth_headers(test_user_id: str) -> dict:
    """Create authorization headers with expired JWT."""
    token = create_test_token(user_id=test_user_id, expired=True)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def invalid_auth_headers() -> dict:
    """Create authorization headers with invalid JWT."""
    return {"Authorization": "Bearer invalid.token.string"}
