"""Task service for CRUD operations with user isolation.

All operations enforce strict user data isolation - users can only
access their own tasks (Constitution Principle III).

Phase 5 Part A: Enhanced with filter, sort, search, and event publishing hooks.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, delete, case, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.task import Task, TaskCreate, TaskUpdate
from src.events.publisher import publish_task_event, publish_reminder_event, schedule_reminder_job

logger = logging.getLogger(__name__)


class TaskNotFoundError(Exception):
    """Raised when a task is not found or not owned by user."""

    pass


# Priority sort mapping: high=3, medium=2, low=1
PRIORITY_ORDER = {"high": 3, "medium": 2, "low": 1}


class TaskService:
    """Service layer for task CRUD operations.

    Enforces user data isolation on all operations.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_task(self, user_id: str, task_data: TaskCreate) -> Task:
        """Create a new task for the authenticated user."""
        task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            completed=task_data.completed,
            priority=task_data.priority,
            tags=task_data.tags,
            due_date=task_data.due_date,
            remind_at=task_data.remind_at,
            is_recurring=task_data.is_recurring,
            recurrence_pattern=task_data.recurrence_pattern,
            recurrence_interval=task_data.recurrence_interval,
        )
        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)

        # Fire-and-forget: publish created event
        task_dict = _task_to_dict(task)
        asyncio.create_task(publish_task_event("created", task_dict, user_id))

        # Schedule reminder if remind_at is set
        if task.remind_at:
            asyncio.create_task(
                publish_reminder_event(task_dict, user_id)
            )
            asyncio.create_task(
                schedule_reminder_job(str(task.id), task.remind_at.isoformat(), user_id)
            )

        return task

    async def get_tasks(
        self,
        user_id: str,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        tags: Optional[list[str]] = None,
        search: Optional[str] = None,
        overdue: Optional[bool] = None,
        due_before: Optional[datetime] = None,
        due_after: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> list[Task]:
        """Get tasks for the authenticated user with optional filters.

        Args:
            user_id: Owner's user ID
            status: Filter by status - 'pending', 'completed', or 'all'
            priority: Filter by priority - 'high', 'medium', 'low'
            tags: Filter by tags (tasks must contain ALL specified tags)
            search: Full-text search on title and description (ILIKE)
            overdue: If True, only overdue tasks (due_date < now AND not completed)
            due_before: Tasks due before this date
            due_after: Tasks due after this date
            sort_by: Sort field - 'created_at', 'due_date', 'priority', 'title'
            sort_dir: Sort direction - 'asc' or 'desc'
        """
        query = select(Task).where(Task.user_id == user_id)

        # Status filter
        if status == "pending":
            query = query.where(Task.completed == False)  # noqa: E712
        elif status == "completed":
            query = query.where(Task.completed == True)  # noqa: E712

        # Priority filter
        if priority:
            query = query.where(Task.priority == priority.lower())

        # Tag filter (tasks must contain ALL specified tags)
        if tags:
            for tag in tags:
                query = query.where(Task.tags.contains([tag.lower()]))

        # Search (ILIKE on title + description)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Task.title.ilike(search_pattern))
                | (Task.description.ilike(search_pattern))
            )

        # Overdue filter
        if overdue:
            now = datetime.utcnow()
            query = query.where(
                Task.due_date < now,
                Task.completed == False,  # noqa: E712
            )

        # Date range filters
        if due_after:
            query = query.where(Task.due_date >= due_after)
        if due_before:
            query = query.where(Task.due_date <= due_before)

        # Sorting
        query = self._apply_sort(query, sort_by, sort_dir)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    def _apply_sort(self, query, sort_by: str, sort_dir: str):
        """Apply sorting to query with null handling."""
        is_asc = sort_dir.lower() == "asc"

        if sort_by == "priority":
            # Custom sort: high=3, medium=2, low=1
            priority_case = case(
                (Task.priority == "high", 3),
                (Task.priority == "medium", 2),
                (Task.priority == "low", 1),
                else_=0,
            )
            order_col = priority_case.asc() if is_asc else priority_case.desc()
            return query.order_by(order_col, Task.created_at.desc())

        elif sort_by == "due_date":
            # Nulls last in ascending, nulls first in descending
            if is_asc:
                return query.order_by(
                    Task.due_date.asc().nulls_last(),
                    Task.created_at.desc(),
                )
            else:
                return query.order_by(
                    Task.due_date.desc().nulls_last(),
                    Task.created_at.desc(),
                )

        elif sort_by == "title":
            order_col = Task.title.asc() if is_asc else Task.title.desc()
            return query.order_by(order_col)

        else:
            # Default: created_at
            order_col = Task.created_at.asc() if is_asc else Task.created_at.desc()
            return query.order_by(order_col)

    async def get_task(self, user_id: str, task_id: UUID) -> Task:
        """Get a specific task by ID."""
        result = await self.session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == user_id)
        )
        task = result.scalar_one_or_none()
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        return task

    async def update_task(
        self, user_id: str, task_id: UUID, task_data: TaskUpdate
    ) -> Task:
        """Update a task's fields (partial update)."""
        task = await self.get_task(user_id, task_id)
        was_completed = task.completed

        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        task.updated_at = datetime.utcnow()

        await self.session.flush()
        await self.session.refresh(task)

        # Fire-and-forget: publish events
        task_dict = _task_to_dict(task)

        # If task was just completed, publish 'completed' event (for recurring task processing)
        if task.completed and not was_completed:
            asyncio.create_task(publish_task_event("completed", task_dict, user_id))
        else:
            asyncio.create_task(publish_task_event("updated", task_dict, user_id))

        # If remind_at was updated, schedule reminder
        if "remind_at" in update_data and task.remind_at:
            asyncio.create_task(publish_reminder_event(task_dict, user_id))
            asyncio.create_task(
                schedule_reminder_job(str(task.id), task.remind_at.isoformat(), user_id)
            )

        return task

    async def delete_task(self, user_id: str, task_id: UUID) -> None:
        """Delete a task permanently."""
        task = await self.get_task(user_id, task_id)
        task_dict = _task_to_dict(task)

        await self.session.execute(
            delete(Task).where(Task.id == task_id, Task.user_id == user_id)
        )

        # Fire-and-forget: publish deleted event
        asyncio.create_task(publish_task_event("deleted", task_dict, user_id))


def _task_to_dict(task: Task) -> dict:
    """Serialize a Task model to a plain dict for event publishing."""
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "tags": task.tags or [],
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "remind_at": task.remind_at.isoformat() if task.remind_at else None,
        "reminder_sent": task.reminder_sent,
        "is_recurring": task.is_recurring,
        "recurrence_pattern": task.recurrence_pattern,
        "recurrence_interval": task.recurrence_interval,
        "parent_task_id": str(task.parent_task_id) if task.parent_task_id else None,
        "user_id": task.user_id,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }
