"""Audit Service - Subscribes to task-events and stores immutable audit records.

Dapr Pub/Sub subscription on topic 'task-events'.
Uses Dapr State Store for append-only audit trail.
"""

import logging
import os
from datetime import datetime
from uuid import uuid4

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audit-service")

app = FastAPI(title="Audit Service", version="1.0.0")

DAPR_URL = os.getenv("DAPR_URL", "http://localhost:3500")
STATE_STORE = os.getenv("STATE_STORE", "statestore")

# Track processed event IDs for idempotency
_processed_events: set[str] = set()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "audit-service"}


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
    """Handle incoming task events from Kafka via Dapr Pub/Sub."""
    try:
        event = await request.json()
        event_data = event.get("data", event)

        event_id = event_data.get("event_id", "")
        event_type = event_data.get("event_type", "unknown")
        task_id = event_data.get("task_id", "")
        user_id = event_data.get("user_id", "")

        # Idempotency check
        if event_id in _processed_events:
            logger.info(f"Duplicate event {event_id} ignored")
            return {"status": "SUCCESS"}

        logger.info(
            f"Audit: {event_type} event for task {task_id} "
            f"(user={user_id}, event_id={event_id})"
        )

        # Build audit record
        audit_record = {
            "audit_id": str(uuid4()),
            "event_id": event_id,
            "event_type": event_type,
            "task_id": task_id,
            "user_id": user_id,
            "task_data": event_data.get("task_data", {}),
            "timestamp": event_data.get("timestamp", datetime.utcnow().isoformat()),
            "recorded_at": datetime.utcnow().isoformat() + "Z",
        }

        # Store in Dapr State Store (append-only pattern)
        await _store_audit_record(audit_record)

        _processed_events.add(event_id)

        # Keep set bounded
        if len(_processed_events) > 10000:
            _processed_events.clear()

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Failed to process audit event: {e}")
        return {"status": "RETRY"}


@app.get("/api/audit/{user_id}")
async def get_audit_trail(user_id: str):
    """Get audit trail for a user."""
    try:
        records = await _get_user_audit_records(user_id)
        return {"user_id": user_id, "records": records, "count": len(records)}
    except Exception as e:
        logger.error(f"Failed to get audit trail: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve audit trail"},
        )


@app.get("/api/audit/{user_id}/task/{task_id}")
async def get_task_audit(user_id: str, task_id: str):
    """Get audit trail for a specific task."""
    try:
        records = await _get_user_audit_records(user_id)
        task_records = [r for r in records if r.get("task_id") == task_id]
        return {
            "user_id": user_id,
            "task_id": task_id,
            "records": task_records,
            "count": len(task_records),
        }
    except Exception as e:
        logger.error(f"Failed to get task audit: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve task audit trail"},
        )


async def _store_audit_record(record: dict) -> None:
    """Store audit record in Dapr State Store."""
    user_id = record["user_id"]
    key = f"audit-{user_id}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Get existing records
            resp = await client.get(f"{DAPR_URL}/v1.0/state/{STATE_STORE}/{key}")
            existing = resp.json() if resp.status_code == 200 and resp.text else []

            # Append new record
            if not isinstance(existing, list):
                existing = []
            existing.append(record)

            # Save back
            await client.post(
                f"{DAPR_URL}/v1.0/state/{STATE_STORE}",
                json=[{"key": key, "value": existing}],
            )
            logger.info(f"Stored audit record {record['audit_id']}")
    except httpx.ConnectError:
        logger.warning("Dapr state store not available - audit record not persisted")
    except Exception as e:
        logger.error(f"Failed to store audit record: {e}")


async def _get_user_audit_records(user_id: str) -> list[dict]:
    """Retrieve audit records for a user from Dapr State Store."""
    key = f"audit-{user_id}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{DAPR_URL}/v1.0/state/{STATE_STORE}/{key}")
            if resp.status_code == 200 and resp.text:
                data = resp.json()
                return data if isinstance(data, list) else []
            return []
    except Exception as e:
        logger.error(f"Failed to get audit records: {e}")
        return []
