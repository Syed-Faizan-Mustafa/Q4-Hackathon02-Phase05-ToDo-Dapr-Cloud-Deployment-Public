"""WebSocket Service - Real-time task updates via WebSocket connections.

Dapr Pub/Sub subscription on topic 'task-updates'.
Maintains WebSocket connections per user and broadcasts events.
"""

import asyncio
import json
import logging
import os
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from jose import jwt, JWTError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket-service")

app = FastAPI(title="WebSocket Service", version="1.0.0")

JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "RS256")

HEARTBEAT_INTERVAL = 30  # seconds


class ConnectionManager:
    """Manages WebSocket connections per user."""

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected (total: {len(self._connections[user_id])})")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self._connections:
            self._connections[user_id] = [
                ws for ws in self._connections[user_id] if ws != websocket
            ]
            if not self._connections[user_id]:
                del self._connections[user_id]
        logger.info(f"User {user_id} disconnected")

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id not in self._connections:
            return

        dead_connections = []
        for ws in self._connections[user_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(ws)

        # Clean up dead connections
        for ws in dead_connections:
            self._connections[user_id] = [
                w for w in self._connections.get(user_id, []) if w != ws
            ]

    @property
    def active_connections(self) -> int:
        return sum(len(conns) for conns in self._connections.values())


manager = ConnectionManager()


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "websocket-service",
        "active_connections": manager.active_connections,
    }


@app.get("/dapr/subscribe")
async def subscribe():
    """Dapr subscription configuration."""
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-updates",
            "route": "/api/events/task-updates",
        }
    ]


@app.post("/api/events/task-updates")
async def handle_task_update(request: Request):
    """Handle task update events from Kafka and broadcast to connected clients."""
    try:
        event = await request.json()
        event_data = event.get("data", event)

        user_id = event_data.get("user_id", "")
        event_type = event_data.get("event_type", "unknown")

        if not user_id:
            logger.warning("Received event without user_id")
            return {"status": "SUCCESS"}

        logger.info(f"Broadcasting {event_type} to user {user_id}")

        await manager.broadcast_to_user(user_id, {
            "type": event_type,
            "task_id": event_data.get("task_id"),
            "task_data": event_data.get("task_data"),
            "notification": event_data.get("notification"),
            "timestamp": event_data.get("timestamp", datetime.utcnow().isoformat()),
        })

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Failed to process task update: {e}")
        return {"status": "RETRY"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(default=""),
):
    """WebSocket endpoint for real-time task updates.

    Authenticates via JWT token in query parameter.
    """
    # Validate JWT token
    if not _validate_token(token, user_id):
        await websocket.close(code=4001, reason="Authentication failed")
        return

    await manager.connect(user_id, websocket)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Real-time updates active",
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Keep connection alive with heartbeat
        while True:
            try:
                # Wait for client message or timeout for heartbeat
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL,
                )
                # Handle ping from client
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat
                try:
                    await websocket.send_json({
                        "type": "heartbeat",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                except Exception:
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        manager.disconnect(user_id, websocket)


def _validate_token(token: str, expected_user_id: str) -> bool:
    """Validate JWT token and verify user_id matches."""
    if not token:
        logger.warning("No token provided for WebSocket connection")
        return False

    if not JWT_PUBLIC_KEY:
        # If no public key configured, skip validation (dev mode)
        logger.warning("JWT_PUBLIC_KEY not set - skipping token validation")
        return True

    try:
        payload = jwt.decode(
            token,
            JWT_PUBLIC_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        token_user_id = payload.get("sub", "")
        if token_user_id != expected_user_id:
            logger.warning(f"Token user_id mismatch: {token_user_id} != {expected_user_id}")
            return False
        return True
    except JWTError as e:
        logger.warning(f"JWT validation failed: {e}")
        return False
