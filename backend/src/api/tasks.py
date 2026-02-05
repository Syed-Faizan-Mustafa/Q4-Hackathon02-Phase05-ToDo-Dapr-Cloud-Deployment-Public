"""Task API endpoints with full CRUD operations.

All endpoints require JWT authentication and enforce user data isolation.
Rate limiting is applied per-user (100 requests/minute).
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

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
    description="Create a new task for the authenticated user. Title is required.",
)
@limiter.limit(get_rate_limit_string())
async def create_task(
    request: Request,
    task_data: TaskCreate,
    session: DbSession,
    user_id: CurrentUserId,
) -> TaskRead:
    """Create a new task (US1).

    Creates a task associated with the authenticated user.
    The task ID and timestamps are automatically generated.
    """
    # Store user_id in request state for rate limiter
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
    description="Get all tasks for the authenticated user, ordered by creation date (newest first).",
)
@limiter.limit(get_rate_limit_string())
async def list_tasks(
    request: Request,
    session: DbSession,
    user_id: CurrentUserId,
) -> list[TaskRead]:
    """List all tasks for the user (US2).

    Returns only tasks belonging to the authenticated user.
    Tasks are ordered by creation time (newest first).
    """
    request.state.user_id = user_id

    service = TaskService(session)
    tasks = await service.get_tasks(user_id)
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
    """Get a specific task by ID (US2).

    Returns the task if it belongs to the authenticated user.
    Returns 404 if task doesn't exist or isn't owned by user.
    """
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
    description="Update specific fields of a task. Only provided fields are updated.",
)
@limiter.limit(get_rate_limit_string())
async def update_task(
    request: Request,
    task_id: UUID,
    task_data: TaskUpdate,
    session: DbSession,
    user_id: CurrentUserId,
) -> TaskRead:
    """Update a task (US3).

    Supports partial updates - only provided fields are modified.
    Updates the updated_at timestamp automatically.
    """
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
    """Replace a task completely (US3).

    Full update - all fields are replaced with provided values.
    Uses TaskCreate schema to require all fields.
    """
    request.state.user_id = user_id

    service = TaskService(session)
    try:
        update_data = TaskUpdate(
            title=task_data.title,
            description=task_data.description,
            completed=task_data.completed,
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
    """Delete a task permanently (US4).

    Removes the task from the database. This action is irreversible.
    """
    request.state.user_id = user_id

    service = TaskService(session)
    try:
        await service.delete_task(user_id, task_id)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
