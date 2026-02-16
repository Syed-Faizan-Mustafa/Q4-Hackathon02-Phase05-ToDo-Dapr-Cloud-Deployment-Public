"""Task model and schemas using SQLModel.

Phase 5 Part A: Enhanced with priority, tags, due_date, remind_at,
recurring task support, and parent task reference.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import field_validator
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


# --- Constants ---

VALID_PRIORITIES = ("high", "medium", "low")
VALID_RECURRENCE_PATTERNS = ("daily", "weekly", "monthly")
MAX_TAGS_PER_TASK = 10
MAX_TAG_LENGTH = 30


# --- Base Model ---


class TaskBase(SQLModel):
    """Base task model with shared fields for create/update operations."""

    title: str = Field(min_length=1, max_length=255, description="Task title (required)")
    description: Optional[str] = Field(
        default=None, max_length=2000, description="Task description (optional)"
    )
    completed: bool = Field(default=False, description="Task completion status")
    priority: str = Field(default="medium", max_length=10, description="Priority: high, medium, low")
    tags: list[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}"),
        description="Task tags (max 10, each max 30 chars)",
    )
    due_date: Optional[datetime] = Field(default=None, description="Task due date")
    remind_at: Optional[datetime] = Field(default=None, description="Reminder timestamp")
    is_recurring: bool = Field(default=False, description="Whether task recurs")
    recurrence_pattern: Optional[str] = Field(
        default=None, max_length=10, description="Recurrence: daily, weekly, monthly"
    )
    recurrence_interval: int = Field(default=1, ge=1, description="Recur every N periods")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(VALID_PRIORITIES)}")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        if len(v) > MAX_TAGS_PER_TASK:
            raise ValueError(f"Maximum {MAX_TAGS_PER_TASK} tags allowed")
        cleaned = []
        for tag in v:
            tag = tag.strip().lower()
            if not tag:
                continue
            if len(tag) > MAX_TAG_LENGTH:
                raise ValueError(f"Each tag must be at most {MAX_TAG_LENGTH} characters")
            if not all(c.isalnum() or c == "-" for c in tag):
                raise ValueError("Tags must be alphanumeric with hyphens only")
            cleaned.append(tag)
        return cleaned

    @field_validator("recurrence_pattern")
    @classmethod
    def validate_recurrence_pattern(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.lower().strip()
        if v not in VALID_RECURRENCE_PATTERNS:
            raise ValueError(f"Recurrence pattern must be one of: {', '.join(VALID_RECURRENCE_PATTERNS)}")
        return v


# --- Database Model ---


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
    reminder_sent: bool = Field(
        default=False,
        description="Whether reminder has been sent",
    )
    parent_task_id: Optional[UUID] = Field(
        default=None,
        foreign_key="tasks.id",
        description="Parent task ID for recurring task chain",
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


# --- Request Schemas ---


class TaskCreate(TaskBase):
    """Schema for creating a new task (request body).

    Only title is required; all other fields have sensible defaults.
    """

    pass


class TaskUpdate(SQLModel):
    """Schema for updating a task (request body).

    All fields are optional for partial updates (PATCH).
    """

    title: Optional[str] = Field(
        default=None, min_length=1, max_length=255, description="Task title"
    )
    description: Optional[str] = Field(
        default=None, max_length=2000, description="Task description"
    )
    completed: Optional[bool] = Field(default=None, description="Task completion status")
    priority: Optional[str] = Field(default=None, max_length=10, description="Priority level")
    tags: Optional[list[str]] = Field(default=None, description="Task tags")
    due_date: Optional[datetime] = Field(default=None, description="Task due date")
    remind_at: Optional[datetime] = Field(default=None, description="Reminder timestamp")
    is_recurring: Optional[bool] = Field(default=None, description="Whether task recurs")
    recurrence_pattern: Optional[str] = Field(
        default=None, max_length=10, description="Recurrence pattern"
    )
    recurrence_interval: Optional[int] = Field(
        default=None, ge=1, description="Recurrence interval"
    )

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.lower().strip()
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(VALID_PRIORITIES)}")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        if len(v) > MAX_TAGS_PER_TASK:
            raise ValueError(f"Maximum {MAX_TAGS_PER_TASK} tags allowed")
        cleaned = []
        for tag in v:
            tag = tag.strip().lower()
            if not tag:
                continue
            if len(tag) > MAX_TAG_LENGTH:
                raise ValueError(f"Each tag must be at most {MAX_TAG_LENGTH} characters")
            if not all(c.isalnum() or c == "-" for c in tag):
                raise ValueError("Tags must be alphanumeric with hyphens only")
            cleaned.append(tag)
        return cleaned

    @field_validator("recurrence_pattern")
    @classmethod
    def validate_recurrence_pattern(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.lower().strip()
        if v not in VALID_RECURRENCE_PATTERNS:
            raise ValueError(f"Recurrence pattern must be one of: {', '.join(VALID_RECURRENCE_PATTERNS)}")
        return v


# --- Response Schema ---


class TaskRead(TaskBase):
    """Schema for reading a task (response body).

    Includes all fields from the database model.
    """

    id: UUID
    user_id: str
    reminder_sent: bool
    parent_task_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""

        from_attributes = True
