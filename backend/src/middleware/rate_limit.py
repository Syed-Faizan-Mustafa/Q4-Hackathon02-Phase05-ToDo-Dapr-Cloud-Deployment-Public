"""Rate limiting middleware using slowapi.

Implements per-user rate limiting based on JWT user_id.
Default: 100 requests per minute per user.
"""

from fastapi import Request, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from src.config import get_settings


def get_user_identifier(request: Request) -> str:
    """Extract rate limit key from request.

    Uses authenticated user_id if available, otherwise falls back to IP.
    This ensures per-user rate limiting for authenticated requests.

    Args:
        request: FastAPI request object

    Returns:
        str: User identifier for rate limiting
    """
    # Check if user_id is set by auth middleware
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Fallback to IP for unauthenticated endpoints (e.g., health check)
    return get_remote_address(request)


# Create limiter instance with user-based key function
limiter = Limiter(key_func=get_user_identifier)


def get_rate_limit_string() -> str:
    """Get rate limit configuration string.

    Returns:
        str: Rate limit in slowapi format (e.g., '100/minute')
    """
    settings = get_settings()
    return f"{settings.rate_limit_per_minute}/minute"


async def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> Response:
    """Custom handler for rate limit exceeded errors.

    Returns a JSON response with proper error structure.

    Args:
        request: FastAPI request object
        exc: Rate limit exceeded exception

    Returns:
        JSONResponse: 429 error response
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "code": "RATE_LIMIT_EXCEEDED",
        },
        headers={"Retry-After": str(exc.retry_after) if exc.retry_after else "60"},
    )
