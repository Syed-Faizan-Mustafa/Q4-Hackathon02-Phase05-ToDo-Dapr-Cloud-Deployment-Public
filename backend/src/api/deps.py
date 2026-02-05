"""FastAPI dependencies for dependency injection.

Provides database session and user authentication dependencies.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_session
from src.middleware.auth import get_current_user


async def get_db() -> AsyncSession:
    """Get database session dependency.

    Yields an async database session that auto-commits on success
    and rolls back on exception.

    Yields:
        AsyncSession: Database session for queries
    """
    async for session in get_session():
        yield session


async def get_current_user_id(
    user_id: Annotated[str, Depends(get_current_user)],
) -> str:
    """Get authenticated user ID dependency.

    Wraps the auth middleware for cleaner dependency injection.
    Validates JWT and extracts user_id from token.

    Args:
        user_id: User ID from JWT token (injected)

    Returns:
        str: Authenticated user's ID
    """
    return user_id


# Type aliases for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
