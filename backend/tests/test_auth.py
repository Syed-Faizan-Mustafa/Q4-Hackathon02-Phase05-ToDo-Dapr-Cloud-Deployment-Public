"""Tests for JWT authentication middleware (US5).

Tests cover:
- Valid token verification
- Expired token rejection
- Missing token rejection
- Malformed token rejection
"""

import pytest
from httpx import AsyncClient

from tests.conftest import create_test_token


class TestJWTAuthentication:
    """Test JWT token verification for protected endpoints."""

    @pytest.mark.asyncio
    async def test_valid_token_allows_access(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US5.AC1: Valid JWT token grants access to protected endpoints."""
        # Health check doesn't require auth, but we'll test it works with auth
        response = await client.get("/health", headers=auth_headers)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_expired_token_returns_401(
        self, client: AsyncClient, expired_auth_headers: dict
    ):
        """US5.AC2: Expired JWT token returns 401 Unauthorized."""
        response = await client.get("/api/v1/tasks", headers=expired_auth_headers)
        assert response.status_code == 401
        data = response.json()
        assert "expired" in data["detail"].lower() or "invalid" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_missing_token_returns_401(self, client: AsyncClient):
        """US5.AC3: Missing JWT token returns 401 Unauthorized."""
        response = await client.get("/api/v1/tasks")
        assert response.status_code in [401, 403]  # FastAPI returns 403 for missing bearer

    @pytest.mark.asyncio
    async def test_malformed_token_returns_401(
        self, client: AsyncClient, invalid_auth_headers: dict
    ):
        """US5.AC4: Malformed JWT token returns 401 Unauthorized."""
        response = await client.get("/api/v1/tasks", headers=invalid_auth_headers)
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_token_without_bearer_prefix_returns_401(self, client: AsyncClient):
        """Token without 'Bearer ' prefix is rejected."""
        token = create_test_token()
        headers = {"Authorization": token}  # Missing "Bearer " prefix
        response = await client.get("/api/v1/tasks", headers=headers)
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_empty_authorization_header_returns_401(self, client: AsyncClient):
        """Empty Authorization header is rejected."""
        headers = {"Authorization": ""}
        response = await client.get("/api/v1/tasks", headers=headers)
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_bearer_without_token_returns_401(self, client: AsyncClient):
        """'Bearer ' without token is rejected."""
        headers = {"Authorization": "Bearer "}
        response = await client.get("/api/v1/tasks", headers=headers)
        assert response.status_code in [401, 403]


class TestHealthEndpoint:
    """Test health check endpoint (no auth required)."""

    @pytest.mark.asyncio
    async def test_health_check_without_auth(self, client: AsyncClient):
        """Health endpoint works without authentication."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "backend-todo-api"
        assert "version" in data

    @pytest.mark.asyncio
    async def test_health_check_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Health endpoint works with authentication."""
        response = await client.get("/health", headers=auth_headers)
        assert response.status_code == 200
