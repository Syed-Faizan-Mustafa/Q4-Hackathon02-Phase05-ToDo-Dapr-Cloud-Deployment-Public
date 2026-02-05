"""Error response schemas for API error handling."""

from typing import Optional

from pydantic import BaseModel, Field


class ValidationErrorDetail(BaseModel):
    """Detail for a single validation error."""

    loc: list[str | int] = Field(description="Location of the error (field path)")
    msg: str = Field(description="Error message")
    type: str = Field(description="Error type identifier")


class ValidationError(BaseModel):
    """Validation error response (422 Unprocessable Entity)."""

    detail: list[ValidationErrorDetail] = Field(description="List of validation errors")


class ErrorResponse(BaseModel):
    """Standard error response for API errors.

    Used for 400, 401, 403, 404, 409, 429, 500 errors.
    """

    detail: str = Field(description="Human-readable error message")
    code: Optional[str] = Field(default=None, description="Machine-readable error code")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "examples": [
                {"detail": "Task not found", "code": "TASK_NOT_FOUND"},
                {"detail": "Invalid or expired token", "code": "INVALID_TOKEN"},
                {"detail": "Rate limit exceeded", "code": "RATE_LIMIT_EXCEEDED"},
            ]
        }
