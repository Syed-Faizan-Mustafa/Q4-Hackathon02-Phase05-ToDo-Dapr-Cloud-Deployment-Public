"""Task API endpoints with full CRUD operations.

All endpoints require JWT authentication and enforce user data isolation.
Rate limiting is applied per-user (100 requests/minute).

Phase 5 Part A: Enhanced with filter, sort, search query parameters.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status

from src.api.deps import DbSession, CurrentUserId
from src.middleware.rate_limit import limiter, get_rate_limit_string
from src.models.task import TaskCreate, TaskUpdate, TaskRead
from src.schemas.error import ErrorResponse
from src.services.task_service import TaskService, TaskNotFoundError

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        401: {"model": ErrorResponse, "description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
    summary="Create a new task",
    description="Create a new task for the authenticated user. Title is required. "
    "Supports priority, tags, due_date, remind_at, and recurrence fields.",
)
@limiter.limit(get_rate_limit_string())
async def create_task(
    request: Request,
    task_data: TaskCreate,
    session: DbSession,
    user_id: CurrentUserId,
) -> TaskRead:
    """Create a new task (US1)."""
    request.state.user_id = user_id

    service = TaskService(session)
    task = await service.create_task(user_id, task_data)
    return TaskRead.model_validate(task)


@router.get(
    "",
    response_model=list[TaskRead],
    responses={
        401: {"model": ErrorResponse, "description": "Authentication required"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
    summary="List all tasks",
    description="Get tasks for the authenticated user with optional filtering, sorting, and search.",
)
@limiter.limit(get_rate_limit_string())
async def list_tasks(
    request: Request,
    session: DbSession,
    user_id: CurrentUserId,
    status_filter: Optional[str] = Query(
        None, alias="status", regex="^(pending|completed|all)$",
        description="Filter by status: pending, completed, all",
    ),
    priority: Optional[str] = Query(
        None, regex="^(high|medium|low)$",
        description="Filter by priority: high, medium, low",
    ),
    tag: Optional[list[str]] = Query(
        None, description="Filter by tag(s). Repeatable: ?tag=work&tag=urgent",
    ),
    search: Optional[str] = Query(
        None, max_length=200, description="Search in title and description",
    ),
    overdue: Optional[bool] = Query(
        None, description="If true, show only overdue tasks",
    ),
    due_before: Optional[str] = Query(
        None, description="ISO date: tasks due before this date",
    ),
    due_after: Optional[str] = Query(
        None, description="ISO date: tasks due after this date",
    ),
    sort_by: str = Query(
        "created_at", regex="^(created_at|due_date|priority|title)$",
        description="Sort field: created_at, due_date, priority, title",
    ),
    sort_dir: str = Query(
        "desc", regex="^(asc|desc)$",
        description="Sort direction: asc, desc",
    ),
) -> list[TaskRead]:
    """List tasks with filters (US2, US5-7)."""
    request.state.user_id = user_id

    # Parse date strings to datetime
    parsed_due_before = _parse_date(due_before) if due_before else None
    parsed_due_after = _parse_date(due_after) if due_after else None

    service = TaskService(session)
    tasks = await service.get_tasks(
        user_id=user_id,
        status=status_filter,
        priority=priority,
        tags=tag,
        search=search,
        overdue=overdue,
        due_before=parsed_due_before,
        due_after=parsed_due_after,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return [TaskRead.model_validate(task) for task in tasks]


@router.get(
    "/{task_id}",
    response_model=TaskRead,
    responses={
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Task not found"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
    summary="Get a specific task",
    description="Get a task by ID. Only accessible if owned by the authenticated user.",
)
@limiter.limit(get_rate_limit_string())
async def get_task(
    request: Request,
    task_id: UUID,
    session: DbSession,
    user_id: CurrentUserId,
) -> TaskRead:
    """Get a specific task by ID (US2)."""
    request.state.user_id = user_id

    service = TaskService(session)
    try:
        task = await service.get_task(user_id, task_id)
        return TaskRead.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )


@router.patch(
    "/{task_id}",
    response_model=TaskRead,
    responses={
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Task not found"},
        422: {"description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
    summary="Update a task (partial)",
    description="Update specific fields of a task. Only provided fields are updated. "
    "Supports priority, tags, due_date, remind_at, and recurrence fields.",
)
@limiter.limit(get_rate_limit_string())
async def update_task(
    request: Request,
    task_id: UUID,
    task_data: TaskUpdate,
    session: DbSession,
    user_id: CurrentUserId,
) -> TaskRead:
    """Update a task (US3)."""
    request.state.user_id = user_id

    service = TaskService(session)
    try:
        task = await service.update_task(user_id, task_id, task_data)
        return TaskRead.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )


@router.put(
    "/{task_id}",
    response_model=TaskRead,
    responses={
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Task not found"},
        422: {"description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
    summary="Update a task (full)",
    description="Replace all fields of a task. All fields must be provided.",
)
@limiter.limit(get_rate_limit_string())
async def replace_task(
    request: Request,
    task_id: UUID,
    task_data: TaskCreate,
    session: DbSession,
    user_id: CurrentUserId,
) -> TaskRead:
    """Replace a task completely (US3)."""
    request.state.user_id = user_id

    service = TaskService(session)
    try:
        update_data = TaskUpdate(
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
        task = await service.update_task(user_id, task_id, update_data)
        return TaskRead.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Task not found"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
    summary="Delete a task",
    description="Permanently delete a task. This action cannot be undone.",
)
@limiter.limit(get_rate_limit_string())
async def delete_task(
    request: Request,
    task_id: UUID,
    session: DbSession,
    user_id: CurrentUserId,
) -> None:
    """Delete a task permanently (US4)."""
    request.state.user_id = user_id

    service = TaskService(session)
    try:
        await service.delete_task(user_id, task_id)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse ISO date string to datetime."""
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None
