"""Better Auth session-based authentication middleware.

Validates session tokens by looking them up in the shared PostgreSQL database.
Extracts user_id from the session record for data isolation.

This approach ensures:
- Session tokens are validated against the database (single source of truth)
- Users created via Better Auth in Next.js are recognized by FastAPI
- Sessions persist across server restarts
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_session

# Security scheme for Swagger UI
security = HTTPBearer(auto_error=True)


class SessionAuthError(Exception):
    """Custom exception for session authentication errors."""

    def __init__(self, detail: str, code: str = "INVALID_SESSION"):
        self.detail = detail
        self.code = code
        super().__init__(detail)


async def verify_session(session_token: str, db: AsyncSession) -> dict:
    """Verify session token by looking it up in the database.

    Args:
        session_token: The session token from the Authorization header
        db: Database session

    Returns:
        dict: Session data including user_id

    Raises:
        SessionAuthError: If session is invalid or expired
    """
    # Query the session table (created by Better Auth via Prisma)
    query = text("""
        SELECT s.id, s.token, s."expiresAt", s."userId", u.email
        FROM session s
        JOIN "user" u ON s."userId" = u.id
        WHERE s.token = :token
    """)

    result = await db.execute(query, {"token": session_token})
    row = result.fetchone()

    if not row:
        raise SessionAuthError(
            detail="Invalid session token",
            code="INVALID_SESSION",
        )

    # Check if session has expired
    expires_at = row.expiresAt
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise SessionAuthError(
            detail="Session has expired",
            code="SESSION_EXPIRED",
        )

    return {
        "session_id": row.id,
        "user_id": row.userId,
        "email": row.email,
    }


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_session),
) -> str:
    """FastAPI dependency to get current authenticated user.

    Validates the session token from the Authorization header
    by looking it up in the shared database.

    Args:
        credentials: HTTP Bearer credentials from Authorization header
        db: Database session

    Returns:
        str: Authenticated user's ID

    Raises:
        HTTPException: 401 if authentication fails
    """
    try:
        session_data = await verify_session(credentials.credentials, db)
        return session_data["user_id"]
    except SessionAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
