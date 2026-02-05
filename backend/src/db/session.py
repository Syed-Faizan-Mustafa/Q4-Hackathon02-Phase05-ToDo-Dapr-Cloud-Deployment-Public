"""Async database session management for Neon PostgreSQL."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

# Lazy initialization - engine created on first use
_engine: Optional[AsyncEngine] = None
_async_session_maker = None


def get_engine() -> AsyncEngine:
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        from src.config import get_settings
        settings = get_settings()
        _engine = create_async_engine(
            settings.async_database_url,
            echo=False,  # Disable SQL logging for better performance
            pool_size=3,  # Smaller pool for serverless
            max_overflow=5,
            pool_pre_ping=True,
            pool_recycle=60,  # Recycle connections more often for Neon
            pool_timeout=30,  # Connection timeout
            connect_args={
                "server_settings": {
                    "statement_timeout": "30000",  # 30 seconds
                    "idle_in_transaction_session_timeout": "30000",
                },
                "command_timeout": 30,
            },
        )
    return _engine


def get_session_maker():
    """Get or create the session maker."""
    global _async_session_maker
    if _async_session_maker is None:
        _async_session_maker = sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _async_session_maker


async def init_db() -> None:
    """Initialize database tables.

    Note: In production, use migrations instead.
    This is for development/testing convenience.
    """
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    global _engine, _async_session_maker
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _async_session_maker = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session.

    Yields:
        AsyncSession: Database session for queries.
    """
    async_session_maker = get_session_maker()
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database session."""
    async_session_maker = get_session_maker()
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
