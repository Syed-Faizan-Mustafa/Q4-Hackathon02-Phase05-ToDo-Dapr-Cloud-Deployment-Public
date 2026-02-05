"""Task service for CRUD operations with user isolation.

All operations enforce strict user data isolation - users can only
access their own tasks (Constitution Principle III).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.task import Task, TaskCreate, TaskUpdate, TaskRead


class TaskNotFoundError(Exception):
    """Raised when a task is not found or not owned by user."""

    pass


class TaskService:
    """Service layer for task CRUD operations.

    Enforces user data isolation on all operations.
    """

    def __init__(self, session: AsyncSession):
        """Initialize service with database session.

        Args:
            session: Async database session
        """
        self.session = session

    async def create_task(self, user_id: str, task_data: TaskCreate) -> Task:
        """Create a new task for the authenticated user.

        Args:
            user_id: ID of the authenticated user
            task_data: Task creation data

        Returns:
            Task: The created task with generated ID and timestamps
        """
        task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            completed=task_data.completed,
        )
        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def get_tasks(self, user_id: str) -> list[Task]:
        """Get all tasks for the authenticated user.

        Tasks are ordered by creation time (newest first).

        Args:
            user_id: ID of the authenticated user

        Returns:
            list[Task]: List of user's tasks
        """
        result = await self.session.execute(
            select(Task)
            .where(Task.user_id == user_id)
            .order_by(Task.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_task(self, user_id: str, task_id: UUID) -> Task:
        """Get a specific task by ID.

        Args:
            user_id: ID of the authenticated user
            task_id: ID of the task to retrieve

        Returns:
            Task: The requested task

        Raises:
            TaskNotFoundError: If task doesn't exist or isn't owned by user
        """
        result = await self.session.execute(
            select(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
        )
        task = result.scalar_one_or_none()
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        return task

    async def update_task(
        self, user_id: str, task_id: UUID, task_data: TaskUpdate
    ) -> Task:
        """Update a task's fields.

        Supports partial updates - only provided fields are updated.
        Updates the updated_at timestamp.

        Args:
            user_id: ID of the authenticated user
            task_id: ID of the task to update
            task_data: Fields to update

        Returns:
            Task: The updated task

        Raises:
            TaskNotFoundError: If task doesn't exist or isn't owned by user
        """
        task = await self.get_task(user_id, task_id)

        # Apply partial updates
        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        # Update timestamp
        task.updated_at = datetime.utcnow()

        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def delete_task(self, user_id: str, task_id: UUID) -> None:
        """Delete a task permanently.

        Args:
            user_id: ID of the authenticated user
            task_id: ID of the task to delete

        Raises:
            TaskNotFoundError: If task doesn't exist or isn't owned by user
        """
        # Verify ownership first
        await self.get_task(user_id, task_id)

        await self.session.execute(
            delete(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
        )
