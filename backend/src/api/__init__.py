"""API package with routers and dependencies."""

from src.api.deps import get_db, get_current_user_id, DbSession, CurrentUserId
from src.api.routes import router as api_router
from src.api.health import router as health_router

__all__ = [
    "get_db",
    "get_current_user_id",
    "DbSession",
    "CurrentUserId",
    "api_router",
    "health_router",
]
