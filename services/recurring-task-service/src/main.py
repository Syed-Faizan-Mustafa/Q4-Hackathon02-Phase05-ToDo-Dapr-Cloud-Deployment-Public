"""Recurring Task Service - Creates next occurrences of completed recurring tasks.

Dapr Pub/Sub subscription on topic 'task-events'.
Filters for 'completed' events where is_recurring=true.
Creates next task via Dapr Service Invocation (backend).
"""

import logging
import os
from datetime import datetime, timedelta
from uuid import uuid4
from dateutil.relativedelta import relativedelta

import httpx
from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recurring-task-service")

app = FastAPI(title="Recurring Task Service", version="1.0.0")

DAPR_URL = os.getenv("DAPR_URL", "http://localhost:3500")
BACKEND_APP_ID = os.getenv("BACKEND_APP_ID", "backend")
PUBSUB_NAME = os.getenv("PUBSUB_NAME", "kafka-pubsub")

# Track processed to prevent duplicate task creation
_processed_events: set[str] = set()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "recurring-task-service"}


@app.get("/dapr/subscribe")
async def subscribe():
    """Dapr subscription configuration."""
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/api/events/task-events",
        }
    ]


@app.post("/api/events/task-events")
async def handle_task_event(request: Request):
    """Handle task events - only process completed recurring tasks."""
    try:
        event = await request.json()
        event_data = event.get("data", event)

        event_id = event_data.get("event_id", "")
        event_type = event_data.get("event_type", "")
        task_data = event_data.get("task_data", {})
        user_id = event_data.get("user_id", "")

        # Only process 'completed' events for recurring tasks
        if event_type != "completed":
            return {"status": "SUCCESS"}

        if not task_data.get("is_recurring", False):
            return {"status": "SUCCESS"}

        # Idempotency check
        if event_id in _processed_events:
            logger.info(f"Duplicate event {event_id} ignored")
            return {"status": "SUCCESS"}

        logger.info(
            f"Recurring task completed: '{task_data.get('title', '')}' "
            f"(pattern={task_data.get('recurrence_pattern')}, "
            f"interval={task_data.get('recurrence_interval', 1)})"
        )

        # Calculate next due date
        next_due = _calculate_next_due_date(
            task_data.get("due_date"),
            task_data.get("recurrence_pattern", "daily"),
            task_data.get("recurrence_interval", 1),
        )

        # Create next task occurrence
        await _create_next_task(task_data, user_id, next_due)

        _processed_events.add(event_id)

        if len(_processed_events) > 10000:
            _processed_events.clear()

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Failed to process recurring task event: {e}")
        return {"status": "RETRY"}


def _calculate_next_due_date(
    current_due: str | None,
    pattern: str,
    interval: int,
) -> str | None:
    """Calculate the next due date based on recurrence pattern."""
    if not current_due:
        # If no due date, calculate from now
        base = datetime.utcnow()
    else:
        try:
            base = datetime.fromisoformat(current_due.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            base = datetime.utcnow()

    if pattern == "daily":
        next_date = base + timedelta(days=interval)
    elif pattern == "weekly":
        next_date = base + timedelta(weeks=interval)
    elif pattern == "monthly":
        next_date = base + relativedelta(months=interval)
    else:
        next_date = base + timedelta(days=interval)

    return next_date.isoformat()


async def _create_next_task(
    original_task: dict,
    user_id: str,
    next_due: str | None,
) -> None:
    """Create the next occurrence of a recurring task via Dapr Service Invocation."""
    new_task = {
        "title": original_task.get("title", ""),
        "description": original_task.get("description"),
        "priority": original_task.get("priority", "medium"),
        "tags": original_task.get("tags", []),
        "due_date": next_due,
        "is_recurring": True,
        "recurrence_pattern": original_task.get("recurrence_pattern"),
        "recurrence_interval": original_task.get("recurrence_interval", 1),
        "completed": False,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Use Dapr Service Invocation to call backend
            response = await client.post(
                f"{DAPR_URL}/v1.0/invoke/{BACKEND_APP_ID}/method/api/v1/tasks",
                json=new_task,
                headers={"x-user-id": user_id},
            )

            if response.status_code < 300:
                created = response.json()
                logger.info(
                    f"Created next occurrence: '{new_task['title']}' "
                    f"(id={created.get('id', 'unknown')}, due={next_due})"
                )
            else:
                logger.error(
                    f"Failed to create next task: {response.status_code} "
                    f"{response.text}"
                )
    except httpx.ConnectError:
        logger.warning("Backend not available via Dapr Service Invocation")
    except Exception as e:
        logger.error(f"Failed to create next recurring task: {e}")
