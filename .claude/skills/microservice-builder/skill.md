# microservice-builder Skill

This skill enhances the `microservice-builder` agent's specialty.

## Agent Role:
The `microservice-builder` is a specialized agent for designing and implementing the 4 new event-driven microservices for the Todo app. Each service is a Kafka consumer via Dapr Pub/Sub that processes events independently.

## Specialty:

### 1. Notification Service
- **Consumes**: `reminders` topic via Dapr Pub/Sub
- **Purpose**: Send reminders to users when tasks are due
- **Endpoints**: `POST /api/events/reminders` (subscription handler), `GET /health`
- **Tech**: Python (FastAPI), Dapr sidecar, httpx
- Handles retry logic, delivery tracking, notification types (in-app, email, push)

### 2. Recurring Task Service
- **Consumes**: `task-events` topic (filtered for completed recurring tasks)
- **Purpose**: Auto-create next occurrence when recurring task completes
- **Endpoints**: `POST /api/events/task-events` (subscription handler), `GET /health`
- **Tech**: Python (FastAPI), Dapr sidecar, httpx
- Calculates next occurrence (daily, weekly, monthly), creates via backend REST API

### 3. Audit Service
- **Consumes**: `task-events` topic (ALL events)
- **Purpose**: Complete activity history for all task operations
- **Endpoints**: `POST /api/events/task-events`, `GET /api/audit/{user_id}`, `GET /api/audit/{user_id}/task/{task_id}`, `GET /health`
- **Tech**: Python (FastAPI), Dapr sidecar (state store)
- Append-only storage, never modifies or deletes audit records

### 4. WebSocket Service
- **Consumes**: `task-updates` topic
- **Purpose**: Real-time broadcast of task changes to connected clients
- **Endpoints**: `POST /api/events/task-updates`, `WS /ws/{user_id}`, `GET /health`
- **Tech**: Python (FastAPI + WebSockets), Dapr sidecar
- Connection lifecycle management, heartbeat/ping-pong, per-user rooms

## Service Template Structure:
```
services/{service-name}/
  src/main.py, config.py, handlers/
  tests/test_handlers.py
  Dockerfile
  requirements.txt
  dapr/subscription.yaml
```

## Operational Guidelines:
- **Single Responsibility**: Each service handles ONE concern
- **Event-Driven**: Services communicate only through Kafka events via Dapr
- **Idempotent Processing**: Handle duplicate events gracefully
- **Container-Ready**: Each service has Dockerfile, health endpoint, K8s manifest
- **ADR Suggestions**: For service boundaries, storage choices, notification delivery

## Output Format:
1. **Service Spec**: Purpose, endpoints, subscriptions, data models
2. **Source Code**: Complete Python service implementation
3. **Dockerfile**: Multi-stage production-ready container
4. **K8s Manifests**: Deployment, Service, Dapr annotations
5. **Tests**: Unit tests for event handlers

## Self-Verification:
Verify each service has health endpoint, graceful shutdown handling, structured JSON logging, and Dapr sidecar annotations before finalizing.
