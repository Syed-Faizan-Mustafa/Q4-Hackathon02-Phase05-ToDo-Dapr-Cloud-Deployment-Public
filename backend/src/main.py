"""FastAPI application entry point.

Backend Todo API Service with JWT authentication, rate limiting,
and CORS support for the frontend application.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi.errors import RateLimitExceeded

from src.api.health import router as health_router
from src.api.routes import router as api_router
from src.db.session import close_db, init_db
from src.middleware.cors import setup_cors
from src.middleware.rate_limit import limiter, rate_limit_exceeded_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager.

    Handles startup and shutdown events:
    - Startup: Initialize database connection pool
    - Shutdown: Close database connections gracefully
    """
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        FastAPI: Configured application instance
    """
    app = FastAPI(
        title="Backend Todo API",
        description="RESTful API for Todo task management with JWT authentication",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Setup CORS (must be before other middleware)
    setup_cors(app)

    # Setup rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # Include routers
    app.include_router(health_router)
    app.include_router(api_router)

    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    from src.config import get_settings

    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
