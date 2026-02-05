"""CORS configuration middleware.

Configures Cross-Origin Resource Sharing for frontend access.
Only allows requests from the configured frontend URL.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings


def setup_cors(app: FastAPI) -> None:
    """Configure CORS middleware for the application.

    Allows requests only from the configured frontend origin.
    Supports credentials for cookie-based sessions if needed.

    Args:
        app: FastAPI application instance
    """
    settings = get_settings()

    # Parse allowed origins (support comma-separated list for flexibility)
    allowed_origins = [
        origin.strip() for origin in settings.frontend_url.split(",") if origin.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
        expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
        max_age=600,  # Cache preflight for 10 minutes
    )
