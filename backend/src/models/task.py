"""Task model and schemas using SQLModel."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class TaskBase(SQLModel):
    """Base task model with shared fields for create/update operations."""

    title: str = Field(min_length=1, max_length=255, description="Task title (required)")
    description: Optional[str] = Field(
        default=None, max_length=2000, description="Task description (optional)"
    )
    completed: bool = Field(default=False, description="Task completion status")


class Task(TaskBase, table=True):
    """Database model for tasks.

    Maps to the 'tasks' table in PostgreSQL.
    """

    __tablename__ = "tasks"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        description="Unique task identifier",
    )
    user_id: str = Field(
        max_length=255,
        index=True,
        nullable=False,
        description="Owner's user ID from JWT sub claim",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Task creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Last modification timestamp",
    )


class TaskCreate(TaskBase):
    """Schema for creating a new task (request body).

    Only title is required; description defaults to None, completed defaults to False.
    """

    pass


class TaskUpdate(SQLModel):
    """Schema for updating a task (request body).

    All fields are optional for partial updates (PATCH).
    For full updates (PUT), validation is handled at the endpoint level.
    """

    title: Optional[str] = Field(
        default=None, min_length=1, max_length=255, description="Task title"
    )
    description: Optional[str] = Field(
        default=None, max_length=2000, description="Task description"
    )
    completed: Optional[bool] = Field(default=None, description="Task completion status")


class TaskRead(TaskBase):
    """Schema for reading a task (response body).

    Includes all fields from the database model.
    """

    id: UUID
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""

        from_attributes = True
