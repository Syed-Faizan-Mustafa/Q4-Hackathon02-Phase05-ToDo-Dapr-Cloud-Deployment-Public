"""Main API router with all task endpoints.

All endpoints require JWT authentication and enforce user data isolation.
"""

from fastapi import APIRouter

from src.api.tasks import router as tasks_router

router = APIRouter(prefix="/api/v1")

# Include task routes
router.include_router(tasks_router)
