"""Event publisher for Dapr Pub/Sub (Kafka).

Publishes task lifecycle events to Kafka topics via the Dapr HTTP API.
Publish failures are logged but never block the HTTP response.

Topics:
  - task-events: All CRUD events (for Audit, Recurring Task services)
  - task-updates: Real-time updates (for WebSocket service)
  - reminders: Reminder events (for Notification service)
"""

import logging
import os
from datetime import datetime
from typing import Optional
from uuid import uuid4

import httpx

logger = logging.getLogger(__name__)

DAPR_URL = os.getenv("DAPR_URL", "http://localhost:3500")
PUBSUB_NAME = os.getenv("PUBSUB_NAME", "kafka-pubsub")

# Topics
TOPIC_TASK_EVENTS = "task-events"
TOPIC_TASK_UPDATES = "task-updates"
TOPIC_REMINDERS = "reminders"


async def publish_task_event(
    event_type: str,
    task_data: dict,
    user_id: str,
) -> None:
    """Publish a task lifecycle event to Kafka via Dapr.

    Args:
        event_type: One of 'created', 'updated', 'completed', 'deleted'
        task_data: Serialized task data dict
        user_id: Owner's user ID
    """
    event = _build_event(event_type, task_data, user_id)

    # Publish to both topics in parallel
    async with httpx.AsyncClient(timeout=5.0) as client:
        # task-events for Audit + Recurring Task services
        await _publish(client, TOPIC_TASK_EVENTS, event)
        # task-updates for WebSocket real-time sync
        await _publish(client, TOPIC_TASK_UPDATES, event)


async def publish_reminder_event(
    task_data: dict,
    user_id: str,
) -> None:
    """Publish a reminder event to the reminders topic.

    Args:
        task_data: Serialized task data dict (must include remind_at)
        user_id: Owner's user ID
    """
    event = _build_event("reminder", task_data, user_id)

    async with httpx.AsyncClient(timeout=5.0) as client:
        await _publish(client, TOPIC_REMINDERS, event)


async def schedule_reminder_job(
    task_id: str,
    remind_at: str,
    user_id: str,
) -> None:
    """Schedule a reminder via Dapr Jobs API.

    Args:
        task_id: Task UUID string
        remind_at: ISO 8601 datetime when reminder should fire
        user_id: Owner's user ID
    """
    job_name = f"reminder-{task_id}"
    job_data = {
        "task_id": task_id,
        "user_id": user_id,
        "remind_at": remind_at,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{DAPR_URL}/v1.0-alpha1/jobs/{job_name}",
                json={
                    "data": job_data,
                    "dueTime": remind_at,
                },
            )
            if response.status_code < 300:
                logger.info(f"Scheduled reminder job '{job_name}' for {remind_at}")
            else:
                logger.warning(
                    f"Failed to schedule job '{job_name}': "
                    f"{response.status_code} {response.text}"
                )
    except Exception as e:
        logger.error(f"Failed to schedule reminder job '{job_name}': {e}")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _build_event(event_type: str, task_data: dict, user_id: str) -> dict:
    """Build a standardized event payload."""
    return {
        "event_id": str(uuid4()),
        "event_type": event_type,
        "task_id": str(task_data.get("id", "")),
        "task_data": task_data,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


async def _publish(client: httpx.AsyncClient, topic: str, event: dict) -> None:
    """Publish an event to a Dapr Pub/Sub topic. Failures are logged only."""
    url = f"{DAPR_URL}/v1.0/publish/{PUBSUB_NAME}/{topic}"
    try:
        response = await client.post(url, json=event)
        if response.status_code < 300:
            logger.info(
                f"Published {event['event_type']} event to {topic} "
                f"(event_id={event['event_id']})"
            )
        else:
            logger.warning(
                f"Dapr publish to {topic} returned {response.status_code}: "
                f"{response.text}"
            )
    except httpx.ConnectError:
        logger.warning(
            f"Dapr sidecar not available at {DAPR_URL} - "
            f"skipping event publish to {topic}"
        )
    except Exception as e:
        logger.error(f"Event publish to {topic} failed: {e}")
