"""Notification Service - Subscribes to reminders and generates in-app notifications.

Dapr Pub/Sub subscription on topic 'reminders'.
Stores notifications in Dapr State Store and publishes to 'task-updates'
for WebSocket delivery.
"""

import logging
import os
from datetime import datetime
from uuid import uuid4

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notification-service")

app = FastAPI(title="Notification Service", version="1.0.0")

DAPR_URL = os.getenv("DAPR_URL", "http://localhost:3500")
STATE_STORE = os.getenv("STATE_STORE", "statestore")
PUBSUB_NAME = os.getenv("PUBSUB_NAME", "kafka-pubsub")


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "notification-service"}


@app.get("/dapr/subscribe")
async def subscribe():
    """Dapr subscription configuration."""
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "reminders",
            "route": "/api/events/reminders",
        }
    ]


@app.post("/api/events/reminders")
async def handle_reminder(request: Request):
    """Handle incoming reminder events from Kafka via Dapr Pub/Sub."""
    try:
        event = await request.json()
        event_data = event.get("data", event)

        event_id = event_data.get("event_id", "")
        task_data = event_data.get("task_data", {})
        user_id = event_data.get("user_id", "")
        task_id = event_data.get("task_id", "")

        logger.info(
            f"Reminder: task '{task_data.get('title', '')}' "
            f"(task_id={task_id}, user_id={user_id})"
        )

        # Create notification record
        notification = {
            "notification_id": str(uuid4()),
            "event_id": event_id,
            "user_id": user_id,
            "task_id": task_id,
            "task_title": task_data.get("title", "Unknown Task"),
            "message": f"Reminder: '{task_data.get('title', '')}' is due!",
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

        # Store notification
        await _store_notification(notification)

        # Publish to task-updates for WebSocket delivery
        await _publish_notification_update(notification, user_id)

        # Update status to sent
        notification["status"] = "sent"
        await _store_notification(notification)

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Failed to process reminder: {e}")
        return {"status": "RETRY"}


async def _store_notification(notification: dict) -> None:
    """Store notification in Dapr State Store."""
    user_id = notification["user_id"]
    key = f"notifications-{user_id}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{DAPR_URL}/v1.0/state/{STATE_STORE}/{key}")
            existing = resp.json() if resp.status_code == 200 and resp.text else []

            if not isinstance(existing, list):
                existing = []

            # Update existing or append
            updated = False
            for i, n in enumerate(existing):
                if n.get("notification_id") == notification["notification_id"]:
                    existing[i] = notification
                    updated = True
                    break
            if not updated:
                existing.append(notification)

            await client.post(
                f"{DAPR_URL}/v1.0/state/{STATE_STORE}",
                json=[{"key": key, "value": existing}],
            )
    except httpx.ConnectError:
        logger.warning("Dapr state store not available")
    except Exception as e:
        logger.error(f"Failed to store notification: {e}")


async def _publish_notification_update(notification: dict, user_id: str) -> None:
    """Publish notification to task-updates topic for WebSocket delivery."""
    update_event = {
        "event_id": str(uuid4()),
        "event_type": "notification",
        "user_id": user_id,
        "task_id": notification["task_id"],
        "notification": notification,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{DAPR_URL}/v1.0/publish/{PUBSUB_NAME}/task-updates",
                json=update_event,
            )
            logger.info(f"Published notification update for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to publish notification update: {e}")
