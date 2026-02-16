# Feature Specification: Phase 5 Part A - Advanced Features + Event-Driven Architecture

**Feature Branch**: `005-phase5-part-a`
**Created**: 2026-02-12
**Status**: Draft
**Input**: Advanced task features, Apache Kafka event streaming, Dapr integration, and 4 new microservices for the Todo AI Chatbot

---

## 1. Overview

Phase 5 Part A transforms the Todo AI Chatbot from a monolithic CRUD application into an event-driven microservices architecture. It adds 7 advanced task management features, introduces Apache Kafka for event streaming, integrates Dapr for infrastructure abstraction, and deploys 4 new consumer microservices.

### Architecture Evolution

```
BEFORE (Phase II-IV - Monolithic):
  Frontend (Next.js) → REST API → Backend (FastAPI) → PostgreSQL

AFTER (Phase 5 Part A - Event-Driven Microservices):
  Frontend (Next.js) → REST API → Backend (FastAPI) → PostgreSQL
                                        │
                                        ├─ Dapr Pub/Sub ─→ Kafka ─→ task-events topic
                                        │                              ├─→ Recurring Task Service
                                        │                              └─→ Audit Service
                                        ├─ Dapr Pub/Sub ─→ Kafka ─→ reminders topic
                                        │                              └─→ Notification Service
                                        └─ Dapr Pub/Sub ─→ Kafka ─→ task-updates topic
                                                                       └─→ WebSocket Service → Clients
```

### Scope

**In Scope:**
- 7 advanced features (recurring tasks, due dates, priorities, tags, search, filter, sort)
- Database schema evolution (new fields on Task model)
- Backend API v2 with filter/sort/search query parameters
- Frontend UI updates for all new features
- MCP tool updates for chatbot integration
- Intent analyzer updates for new intents
- Kafka topic design and event schemas
- Dapr component configuration (Pub/Sub, State, Service Invocation, Jobs, Secrets)
- 4 new microservices (Notification, Recurring Task, Audit, WebSocket)
- Event publishing from backend on all CRUD operations

**Out of Scope:**
- Kubernetes deployment (Part B)
- Cloud deployment (Part C)
- CI/CD pipelines (Part C)
- Monitoring/observability (Part C)
- Email/SMS notifications (in-app only for MVP)
- Elasticsearch (use PostgreSQL full-text search)
- OAuth/social login

---

## 2. User Scenarios & Testing

### User Story 1 - Set Task Priority (Priority: P1)

As an authenticated user, I want to assign priority levels to my tasks so that I can focus on what matters most.

**Why this priority**: Priority is the most requested organizational feature. It directly impacts how users plan their work.

**Acceptance Scenarios**:

1. **Given** I am creating a new task, **When** I select a priority level (High/Medium/Low), **Then** the task is created with that priority and displays the corresponding color badge.
2. **Given** I have existing tasks, **When** I update a task's priority, **Then** the priority badge updates immediately.
3. **Given** I have tasks with different priorities, **When** I filter by "High Priority", **Then** only high-priority tasks are shown.
4. **Given** I am using the chatbot, **When** I say "add high priority task: fix login bug", **Then** the task is created with high priority.
5. **Given** a new task is created without specifying priority, **Then** it defaults to "Medium".

---

### User Story 2 - Add Tags to Tasks (Priority: P2)

As an authenticated user, I want to tag my tasks with custom labels so that I can organize and group related tasks.

**Acceptance Scenarios**:

1. **Given** I am creating/editing a task, **When** I add tags (e.g., "work", "urgent"), **Then** the tags appear as colored chips on the task card.
2. **Given** I have tagged tasks, **When** I click a tag or filter by tag, **Then** only tasks with that tag are shown.
3. **Given** I am using the chatbot, **When** I say "add task 'review PR' with tags: work, urgent", **Then** the task is created with both tags.
4. **Given** existing tags in my tasks, **When** I type a tag in the input, **Then** I see autocomplete suggestions from existing tags.

---

### User Story 3 - Due Dates with Native DB Support (Priority: P1)

As an authenticated user, I want proper due date support (not stored in description) so that I can sort and filter by deadlines.

**Acceptance Scenarios**:

1. **Given** I am creating/editing a task, **When** I set a due date via date picker, **Then** the due date is stored as a proper database field.
2. **Given** a task has a due date in the past, **When** I view the task list, **Then** the task shows an "Overdue" badge in red.
3. **Given** tasks with due dates, **When** I sort by "Due Date", **Then** tasks are ordered by deadline (soonest first).
4. **Given** I am using the chatbot, **When** I say "set task 2 due tomorrow", **Then** the due_date field is updated (not description).
5. **Given** a task with a due date, **When** I set a reminder, **Then** the reminder is scheduled via Dapr Jobs API.

---

### User Story 4 - Recurring Tasks (Priority: P2)

As an authenticated user, I want to create tasks that automatically recur so that I don't have to recreate routine tasks.

**Acceptance Scenarios**:

1. **Given** I create a task with recurrence "daily", **When** I complete the task, **Then** a new identical task is automatically created for the next day.
2. **Given** I create a weekly recurring task, **When** I complete it, **Then** the next occurrence is created 7 days later.
3. **Given** I create a monthly recurring task, **When** I complete it, **Then** the next occurrence is created for the same day next month.
4. **Given** the chatbot, **When** I say "add a daily task to check emails", **Then** the task is created with daily recurrence.
5. **Given** a recurring task is completed, **When** the Recurring Task Service processes the event, **Then** it creates the next instance and emits a `task-events.created` event.

---

### User Story 5 - Search Tasks (Priority: P1)

As an authenticated user, I want to search through my tasks so that I can quickly find specific items.

**Acceptance Scenarios**:

1. **Given** I have many tasks, **When** I type in the search bar, **Then** tasks matching the search term (in title or description) are shown with debounced filtering (300ms).
2. **Given** I search for "meeting", **When** results appear, **Then** matching text is highlighted.
3. **Given** I am using the chatbot, **When** I say "search for tasks about meeting", **Then** matching tasks are returned.
4. **Given** no tasks match my search, **Then** I see an empty state with suggestion text.

---

### User Story 6 - Advanced Filtering (Priority: P1)

As an authenticated user, I want to filter tasks by multiple criteria so that I can focus on specific subsets.

**Acceptance Scenarios**:

1. **Given** I have tasks, **When** I filter by status + priority, **Then** only tasks matching both criteria are shown.
2. **Given** I have tagged tasks, **When** I filter by tag "work", **Then** only work-tagged tasks appear.
3. **Given** I filter by "Overdue", **When** tasks with past due dates exist, **Then** only overdue tasks are shown.
4. **Given** I am using the chatbot, **When** I say "show my high priority tasks", **Then** only high-priority tasks are listed.

---

### User Story 7 - Advanced Sorting (Priority: P2)

As an authenticated user, I want to sort tasks by different criteria so that I can view them in my preferred order.

**Acceptance Scenarios**:

1. **Given** tasks exist, **When** I sort by "Due Date" ascending, **Then** tasks with soonest deadlines appear first (null due dates last).
2. **Given** tasks exist, **When** I sort by "Priority" descending, **Then** High → Medium → Low order.
3. **Given** tasks exist, **When** I sort by "Title" ascending, **Then** alphabetical order.
4. **Given** the chatbot, **When** I say "list tasks sorted by due date", **Then** tasks are returned sorted by deadline.

---

### User Story 8 - Real-Time Task Updates (Priority: P3)

As an authenticated user, I want to see task changes in real-time so that my view stays current across tabs/devices.

**Acceptance Scenarios**:

1. **Given** I have the task list open in two tabs, **When** I complete a task in tab 1, **Then** tab 2 updates automatically via WebSocket.
2. **Given** I am connected via WebSocket, **When** a recurring task is auto-created, **Then** I see it appear in my task list.
3. **Given** the WebSocket connection drops, **When** it reconnects, **Then** I receive any missed updates.

---

### User Story 9 - Audit Trail (Priority: P3)

As a system feature, all task operations must be logged for compliance and debugging.

**Acceptance Scenarios**:

1. **Given** any task CRUD operation, **When** the event is published to Kafka, **Then** the Audit Service stores a complete record.
2. **Given** audit records exist, **When** an admin queries the audit API, **Then** the complete operation history is returned.
3. **Given** an audit record, **Then** it contains: event_type, task_id, task_data, user_id, timestamp, and is immutable.

---

### Edge Cases

- What happens when a recurring task is deleted? Recurrence stops; no new instances are created.
- What happens when a tag has special characters? Tags are alphanumeric + hyphens only, max 30 chars each, max 10 tags per task.
- What happens when search query is empty? Show all tasks (unfiltered).
- What happens when filter + search + sort are all active? All criteria are applied together (AND logic for filters).
- What happens when Kafka is unavailable? Backend continues to work (CRUD succeeds), events are logged to dead-letter queue for retry.
- What happens when Dapr sidecar is not ready? Application waits with health check; requests that need Dapr return 503.

---

## 3. Requirements

### 3.1 Functional Requirements - Advanced Features

#### Priorities
- **FR-A001**: System MUST support 3 priority levels: `high`, `medium`, `low` (default: `medium`)
- **FR-A002**: Priority MUST be stored as an enum field in the Task model
- **FR-A003**: Backend MUST accept `priority` in create/update endpoints
- **FR-A004**: Backend MUST support filtering by priority via query parameter `?priority=high`
- **FR-A005**: Frontend MUST display color-coded priority badges (red=high, yellow=medium, green=low)
- **FR-A006**: Chatbot MUST recognize priority in add_task intent (e.g., "high priority task: ...")

#### Tags
- **FR-A007**: System MUST support flexible tagging with a text array field
- **FR-A008**: Tags MUST be alphanumeric + hyphens, max 30 chars each, max 10 per task
- **FR-A009**: Backend MUST accept `tags` array in create/update endpoints
- **FR-A010**: Backend MUST support filtering by tag via query parameter `?tag=work`
- **FR-A011**: Frontend MUST display tag chips and provide tag autocomplete
- **FR-A012**: Chatbot MUST recognize tags in add_task intent (e.g., "with tags: work, urgent")

#### Due Dates (Native)
- **FR-A013**: System MUST store `due_date` as a proper TIMESTAMP field (not in description)
- **FR-A014**: System MUST store `remind_at` as an optional TIMESTAMP field
- **FR-A015**: Backend MUST accept `due_date` and `remind_at` in create/update endpoints
- **FR-A016**: Frontend MUST provide a date picker for due dates
- **FR-A017**: Frontend MUST display "Overdue" badge for past-due tasks
- **FR-A018**: Backend MUST support filtering by `?overdue=true` and `?due_before=<date>&due_after=<date>`
- **FR-A019**: When `remind_at` is set, system MUST schedule a reminder via Dapr Jobs API

#### Recurring Tasks
- **FR-A020**: System MUST support recurrence patterns: `daily`, `weekly`, `monthly`, `none` (default: `none`)
- **FR-A021**: Task model MUST include `is_recurring` (bool), `recurrence_pattern` (enum), `recurrence_interval` (int, default 1)
- **FR-A022**: When a recurring task is completed, the Recurring Task Service MUST create the next instance
- **FR-A023**: Next occurrence calculation: daily (+N days), weekly (+N*7 days), monthly (+N months)
- **FR-A024**: Chatbot MUST recognize recurrence patterns (e.g., "daily task", "every week")

#### Search
- **FR-A025**: Backend MUST support full-text search via `?search=<query>` on title and description
- **FR-A026**: Search MUST use PostgreSQL `to_tsvector`/`to_tsquery` or ILIKE for simplicity
- **FR-A027**: Frontend MUST provide a search bar with 300ms debounce
- **FR-A028**: Chatbot MUST recognize search intent (e.g., "search for tasks about meeting")

#### Filter
- **FR-A029**: Backend MUST support combined filtering: `?status=pending&priority=high&tag=work&overdue=true`
- **FR-A030**: All filters MUST use AND logic when combined
- **FR-A031**: Frontend MUST display active filter chips with remove capability
- **FR-A032**: Chatbot MUST support filter intents (e.g., "show high priority pending tasks")

#### Sort
- **FR-A033**: Backend MUST support sorting: `?sort_by=created_at|due_date|priority|title&sort_dir=asc|desc`
- **FR-A034**: Default sort: `created_at` descending
- **FR-A035**: Priority sort order: high(3) > medium(2) > low(1)
- **FR-A036**: Null due dates MUST sort last in ascending, first in descending
- **FR-A037**: Frontend MUST provide sort dropdown with direction toggle
- **FR-A038**: Chatbot MUST support sort in list intent (e.g., "list tasks sorted by priority")

### 3.2 Functional Requirements - Kafka Event Architecture

#### Topics
- **FR-K001**: System MUST create 3 Kafka topics: `task-events`, `reminders`, `task-updates`
- **FR-K002**: `task-events` topic: partitions=3, replication=1(local)/3(cloud), retention=7d
- **FR-K003**: `reminders` topic: partitions=1, replication=1(local)/3(cloud), retention=1d
- **FR-K004**: `task-updates` topic: partitions=3, replication=1(local)/3(cloud), retention=1h

#### Event Schemas
- **FR-K005**: Task Event schema MUST include: `event_id` (UUID), `event_type` (created|updated|completed|deleted), `task_id` (UUID), `task_data` (full task object), `user_id` (string), `timestamp` (ISO 8601)
- **FR-K006**: Reminder Event schema MUST include: `event_id` (UUID), `task_id` (UUID), `title` (string), `due_at` (ISO datetime), `remind_at` (ISO datetime), `user_id` (string)
- **FR-K007**: All events MUST include `event_id` for deduplication
- **FR-K008**: All events MUST include `user_id` for data isolation

#### Producers
- **FR-K009**: Backend MUST publish task events on every CRUD operation via Dapr Pub/Sub
- **FR-K010**: Backend MUST publish reminder events when `remind_at` is set via Dapr Pub/Sub
- **FR-K011**: Backend MUST publish task-update events for real-time sync via Dapr Pub/Sub
- **FR-K012**: Event publishing MUST NOT block the HTTP response (fire-and-forget with logging)
- **FR-K013**: If Dapr sidecar is unavailable, events MUST be logged to a fallback file for retry

#### Consumers
- **FR-K014**: Each consumer MUST be idempotent (handle duplicate events gracefully via event_id)
- **FR-K015**: Each consumer MUST implement a dead-letter queue for failed events
- **FR-K016**: Consumer groups: `recurring-task-group`, `audit-group`, `notification-group`, `websocket-group`

### 3.3 Functional Requirements - Dapr Integration

- **FR-D001**: System MUST use Dapr Pub/Sub (`pubsub.kafka`) for all Kafka interactions
- **FR-D002**: System MUST use Dapr State Store (`state.postgresql`) for microservice state
- **FR-D003**: System MUST use Dapr Service Invocation for inter-service HTTP calls
- **FR-D004**: System MUST use Dapr Jobs API for scheduling reminders
- **FR-D005**: System MUST use Dapr Secrets Store (`secretstores.kubernetes`) for credentials
- **FR-D006**: All Dapr components MUST be configurable via YAML component files
- **FR-D007**: Application code MUST interact with Dapr via `http://localhost:3500` sidecar

### 3.4 Functional Requirements - Microservices

#### Notification Service
- **FR-M001**: MUST subscribe to `reminders` topic via Dapr Pub/Sub
- **FR-M002**: MUST process reminder events and generate in-app notifications
- **FR-M003**: MUST track notification delivery status (pending, sent, failed)
- **FR-M004**: MUST expose `/health` endpoint for Kubernetes probes

#### Recurring Task Service
- **FR-M005**: MUST subscribe to `task-events` topic via Dapr Pub/Sub
- **FR-M006**: MUST filter for `completed` events where `is_recurring=true`
- **FR-M007**: MUST calculate next occurrence based on recurrence pattern
- **FR-M008**: MUST create next task instance via Backend REST API (Dapr Service Invocation)
- **FR-M009**: MUST publish `task-events.created` event for the new task instance
- **FR-M010**: MUST expose `/health` endpoint

#### Audit Service
- **FR-M011**: MUST subscribe to `task-events` topic via Dapr Pub/Sub (ALL events)
- **FR-M012**: MUST store every event as an immutable audit record
- **FR-M013**: MUST provide query API: `GET /api/audit/{user_id}` and `GET /api/audit/{user_id}/task/{task_id}`
- **FR-M014**: MUST use Dapr State Store for audit record persistence
- **FR-M015**: MUST expose `/health` endpoint

#### WebSocket Service
- **FR-M016**: MUST subscribe to `task-updates` topic via Dapr Pub/Sub
- **FR-M017**: MUST maintain WebSocket connections per user (`WS /ws/{user_id}`)
- **FR-M018**: MUST broadcast task changes to all connected clients of the same user
- **FR-M019**: MUST implement heartbeat/ping-pong every 30 seconds
- **FR-M020**: MUST handle reconnection gracefully
- **FR-M021**: MUST expose `/health` endpoint

---

## 4. Data Model Changes

### 4.1 Task Model Evolution

```
CURRENT Task Table:
  id          : UUID (PK)
  user_id     : VARCHAR(255)
  title       : VARCHAR(255)
  description : TEXT
  completed   : BOOLEAN
  created_at  : TIMESTAMP WITH TZ
  updated_at  : TIMESTAMP WITH TZ

NEW Fields (Phase 5 Part A):
  priority           : VARCHAR(10) NOT NULL DEFAULT 'medium'  -- 'high', 'medium', 'low'
  tags               : TEXT[] DEFAULT '{}'                     -- PostgreSQL array
  due_date           : TIMESTAMP WITH TZ NULL                 -- Proper due date field
  remind_at          : TIMESTAMP WITH TZ NULL                 -- Reminder timestamp
  reminder_sent      : BOOLEAN NOT NULL DEFAULT FALSE         -- Reminder delivery status
  is_recurring       : BOOLEAN NOT NULL DEFAULT FALSE
  recurrence_pattern : VARCHAR(10) NULL DEFAULT NULL           -- 'daily', 'weekly', 'monthly'
  recurrence_interval: INTEGER NOT NULL DEFAULT 1              -- Every N days/weeks/months
  parent_task_id     : UUID NULL REFERENCES tasks(id) ON DELETE SET NULL  -- For recurring chain
```

### 4.2 New Indexes

```sql
CREATE INDEX idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX idx_tasks_recurring ON tasks(user_id, is_recurring) WHERE is_recurring = TRUE;
```

### 4.3 Migration Strategy

Single migration `002_phase5_advanced_features.sql`:
- All new columns have defaults → no breaking changes for existing tasks
- Existing `due_date` data stored in description (via `set_due_date` MCP tool) should be migrated to the new `due_date` column
- GIN indexes for tags and full-text search

### 4.4 Event Schemas

#### Task Event (Published to `task-events`)
```json
{
  "event_id": "uuid-v4",
  "event_type": "created | updated | completed | deleted",
  "task_id": "uuid",
  "task_data": {
    "id": "uuid",
    "user_id": "string",
    "title": "string",
    "description": "string | null",
    "completed": "boolean",
    "priority": "high | medium | low",
    "tags": ["string"],
    "due_date": "ISO 8601 | null",
    "is_recurring": "boolean",
    "recurrence_pattern": "daily | weekly | monthly | null",
    "recurrence_interval": "integer",
    "created_at": "ISO 8601",
    "updated_at": "ISO 8601"
  },
  "user_id": "string",
  "timestamp": "ISO 8601"
}
```

#### Reminder Event (Published to `reminders`)
```json
{
  "event_id": "uuid-v4",
  "task_id": "uuid",
  "title": "string",
  "due_at": "ISO 8601",
  "remind_at": "ISO 8601",
  "user_id": "string",
  "timestamp": "ISO 8601"
}
```

#### Task Update Event (Published to `task-updates`)
```json
{
  "event_id": "uuid-v4",
  "event_type": "created | updated | completed | deleted",
  "task_id": "uuid",
  "task_data": { "...same as task event..." },
  "user_id": "string",
  "timestamp": "ISO 8601"
}
```

---

## 5. API Contract Changes

### 5.1 Updated Backend API

#### GET /api/v1/tasks (Enhanced)

**New Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `all` | `pending`, `completed`, `all` |
| `priority` | string | - | `high`, `medium`, `low` |
| `tag` | string | - | Filter by tag (repeatable: `?tag=work&tag=urgent`) |
| `search` | string | - | Full-text search on title + description |
| `overdue` | boolean | - | `true` to show only overdue tasks |
| `due_before` | string | - | ISO date: tasks due before this date |
| `due_after` | string | - | ISO date: tasks due after this date |
| `sort_by` | string | `created_at` | `created_at`, `due_date`, `priority`, `title` |
| `sort_dir` | string | `desc` | `asc`, `desc` |

**Response**: Array of `TaskRead` (enhanced with new fields)

#### POST /api/v1/tasks (Enhanced)

**New Body Fields:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "high | medium | low (default: medium)",
  "tags": ["string"] ,
  "due_date": "ISO 8601 datetime (optional)",
  "remind_at": "ISO 8601 datetime (optional)",
  "is_recurring": false,
  "recurrence_pattern": "daily | weekly | monthly (optional)",
  "recurrence_interval": 1
}
```

#### PATCH /api/v1/tasks/{task_id} (Enhanced)

All new fields are optional in partial update.

### 5.2 Updated TaskRead Response Schema

```json
{
  "id": "uuid",
  "user_id": "string",
  "title": "string",
  "description": "string | null",
  "completed": "boolean",
  "priority": "high | medium | low",
  "tags": ["string"],
  "due_date": "ISO 8601 | null",
  "remind_at": "ISO 8601 | null",
  "reminder_sent": "boolean",
  "is_recurring": "boolean",
  "recurrence_pattern": "daily | weekly | monthly | null",
  "recurrence_interval": "integer",
  "parent_task_id": "uuid | null",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}
```

### 5.3 New MCP Tools

#### set_priority
```json
{
  "name": "set_priority",
  "input": { "task_id": "string", "priority": "high | medium | low" }
}
```

#### add_tags
```json
{
  "name": "add_tags",
  "input": { "task_id": "string", "tags": ["string"] }
}
```

#### search_tasks
```json
{
  "name": "search_tasks",
  "input": { "query": "string", "filters": { "priority": "...", "status": "...", "tag": "..." } }
}
```

#### set_recurring
```json
{
  "name": "set_recurring",
  "input": { "task_id": "string", "pattern": "daily | weekly | monthly", "interval": 1 }
}
```

### 5.4 New Intent Types

| Intent | Examples | Entities |
|--------|----------|----------|
| `set_priority` | "set task 5 to high priority" | task_id, priority |
| `add_tags` | "tag task 3 as work, urgent" | task_id, tags[] |
| `search_tasks` | "search for meeting tasks" | query |
| `set_recurring` | "make task 2 repeat daily" | task_id, pattern, interval |

Existing intents `add_task`, `list_tasks` are enhanced:
- `add_task`: Now extracts `priority`, `tags`, `recurrence_pattern`
- `list_tasks`: Now extracts `priority_filter`, `tag_filter`, `sort_by`, `sort_dir`

### 5.5 Microservice APIs

#### Audit Service
- `GET /api/audit/{user_id}` - List audit records for user
- `GET /api/audit/{user_id}/task/{task_id}` - Task-specific audit trail
- `POST /api/events/task-events` - Dapr subscription endpoint (internal)

#### WebSocket Service
- `WS /ws/{user_id}` - WebSocket connection for real-time updates
- `POST /api/events/task-updates` - Dapr subscription endpoint (internal)

#### Notification Service
- `POST /api/events/reminders` - Dapr subscription endpoint (internal)

#### Recurring Task Service
- `POST /api/events/task-events` - Dapr subscription endpoint (internal)

All services expose `GET /health` for Kubernetes probes.

---

## 6. Dapr Component Configurations

### 6.1 Pub/Sub (Kafka)
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "kafka:9092"            # Strimzi on Minikube
    - name: consumerGroup
      value: "{service-name}-group"
    - name: authType
      value: "none"                  # mTLS in production
```

### 6.2 State Store (PostgreSQL)
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
    - name: connectionString
      secretKeyRef:
        name: db-credentials
        key: connectionString
```

### 6.3 Secrets Store (Kubernetes)
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
spec:
  type: secretstores.kubernetes
  version: v1
```

---

## 7. Microservice Directory Structure

```
services/
  notification-service/
    src/
      main.py
      config.py
      handlers/
        reminder_handler.py
    tests/
      test_reminder_handler.py
    Dockerfile
    requirements.txt
    dapr/
      subscription.yaml

  recurring-task-service/
    src/
      main.py
      config.py
      handlers/
        task_event_handler.py
      utils/
        recurrence_calculator.py
    tests/
      test_task_event_handler.py
      test_recurrence_calculator.py
    Dockerfile
    requirements.txt
    dapr/
      subscription.yaml

  audit-service/
    src/
      main.py
      config.py
      handlers/
        audit_handler.py
      api/
        audit_routes.py
    tests/
      test_audit_handler.py
    Dockerfile
    requirements.txt
    dapr/
      subscription.yaml

  websocket-service/
    src/
      main.py
      config.py
      handlers/
        task_update_handler.py
      ws/
        connection_manager.py
    tests/
      test_connection_manager.py
    Dockerfile
    requirements.txt
    dapr/
      subscription.yaml
```

---

## 8. Success Criteria

| ID | Metric | Target |
|----|--------|--------|
| SC-001 | All 7 advanced features work end-to-end | 100% |
| SC-002 | Backend API supports filter/sort/search with <500ms response | P95 < 500ms |
| SC-003 | Kafka events published for all CRUD operations | 100% |
| SC-004 | Event end-to-end latency (publish → consumer process) | < 2 seconds |
| SC-005 | All 4 microservices respond to health checks | 100% |
| SC-006 | Recurring task auto-creation on completion | 100% reliability |
| SC-007 | WebSocket real-time updates received | < 1 second latency |
| SC-008 | Audit trail captures all operations | 100% completeness |
| SC-009 | No breaking changes to existing CRUD API | Zero regressions |
| SC-010 | Chatbot recognizes new intents (priority, tags, recurring, search) | > 90% accuracy |

---

## 9. Assumptions

1. PostgreSQL supports array types and full-text search (GIN indexes) on Neon
2. Dapr 1.12+ is available with Jobs API support
3. Strimzi Kafka Operator 0.38+ for Kubernetes deployment
4. Existing Better Auth JWT tokens work for all new endpoints
5. WebSocket connections are limited to authenticated users
6. Notification Service delivers in-app notifications only (no email/SMS)
7. Audit records use Dapr State Store (not a separate database)
8. Single Kafka cluster (Strimzi) for local development
9. Event schemas are v1 - backward compatible updates only
10. Maximum 10 tags per task, 30 chars each

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Kafka adds operational complexity | High | Use Dapr abstraction; Kafka can be swapped for Redis Streams locally |
| Database migration on existing data | Medium | All new fields have defaults; migration is additive only |
| Event ordering in Kafka | Medium | Partition by user_id for per-user ordering |
| WebSocket scaling | Low | Single-instance for MVP; Redis pub/sub adapter for multi-instance |

---

## 11. Clarifications

### Session 2026-02-12

- Q: Should due_date replace the description-based approach? A: Yes. Migrate existing description-based dates to the new `due_date` column. The MCP set_due_date tool should update the `due_date` field directly.
- Q: Should tags be stored as PostgreSQL array or separate table? A: PostgreSQL TEXT[] array for simplicity. GIN index for efficient filtering.
- Q: Should search use PostgreSQL full-text search or ILIKE? A: Start with ILIKE for simplicity; can upgrade to `tsvector/tsquery` if performance requires.
- Q: What notification method for reminders? A: In-app only (via WebSocket push to connected clients). Email/SMS is out of scope.
