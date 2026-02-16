# Implementation Plan: Phase 5 Part A - Advanced Features + Event-Driven Architecture

**Feature**: 004-phase5-part-a
**Date**: 2026-02-12
**Spec Reference**: `specs/004-phase5-part-a/spec.md`

---

## 1. Implementation Phases

The implementation is divided into 6 ordered phases to minimize risk and ensure backward compatibility:

```
Phase 1: Database Schema Evolution          (Foundation)
Phase 2: Backend API Enhancement            (Core Logic)
Phase 3: Frontend UI Updates                (User-Facing)
Phase 4: MCP Tools + Intent Analyzer        (Chatbot Integration)
Phase 5: Kafka + Dapr + Event Publishing    (Event Infrastructure)
Phase 6: 4 Microservices                    (Event Consumers)
```

---

## 2. Phase 1: Database Schema Evolution

### 2.1 Decision: Single Migration File

Create `002_phase5_advanced_features.sql` that adds all new columns to the `tasks` table. All columns have sensible defaults for backward compatibility.

### 2.2 SQLModel Changes

**File**: `backend/src/models/task.py`

Add new fields to `Task`, `TaskCreate`, `TaskUpdate`, `TaskRead` models:

```python
# New fields on Task (table=True)
priority: str = Field(default="medium", max_length=10)
tags: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))
due_date: Optional[datetime] = Field(default=None)
remind_at: Optional[datetime] = Field(default=None)
reminder_sent: bool = Field(default=False)
is_recurring: bool = Field(default=False)
recurrence_pattern: Optional[str] = Field(default=None, max_length=10)
recurrence_interval: int = Field(default=1)
parent_task_id: Optional[UUID] = Field(default=None, foreign_key="tasks.id")
```

### 2.3 Migration SQL

```sql
ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE tasks ADD COLUMN remind_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE tasks ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_pattern VARCHAR(10) NULL;
ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tasks ADD COLUMN parent_task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL;

-- Constraints
ALTER TABLE tasks ADD CONSTRAINT chk_priority CHECK (priority IN ('high', 'medium', 'low'));
ALTER TABLE tasks ADD CONSTRAINT chk_recurrence_pattern CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly') OR recurrence_pattern IS NULL);
ALTER TABLE tasks ADD CONSTRAINT chk_recurrence_interval CHECK (recurrence_interval >= 1);
ALTER TABLE tasks ADD CONSTRAINT chk_tags_length CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10);

-- Indexes
CREATE INDEX idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_recurring ON tasks(user_id, is_recurring) WHERE is_recurring = TRUE;
```

### 2.4 Data Migration

Migrate existing due dates stored in description (📅 Due: ...) to the new `due_date` column:

```sql
-- Extract ISO dates from description field
UPDATE tasks SET due_date = ... WHERE description LIKE '%📅 Due:%';
-- Clean description field
UPDATE tasks SET description = regexp_replace(description, E'\n?📅 Due:.*$', '', 'g');
```

---

## 3. Phase 2: Backend API Enhancement

### 3.1 Task Service Updates

**File**: `backend/src/services/task_service.py`

Enhance `get_tasks()` to accept filter, sort, and search parameters:

```python
async def get_tasks(
    self,
    user_id: str,
    status: Optional[str] = None,      # pending, completed, all
    priority: Optional[str] = None,     # high, medium, low
    tags: Optional[list[str]] = None,   # filter by tags
    search: Optional[str] = None,       # full-text search
    overdue: Optional[bool] = None,     # overdue only
    due_before: Optional[datetime] = None,
    due_after: Optional[datetime] = None,
    sort_by: str = "created_at",        # created_at, due_date, priority, title
    sort_dir: str = "desc",             # asc, desc
) -> list[Task]:
```

Query construction:
1. Start with `WHERE user_id = :user_id`
2. Add status filter: `AND completed = FALSE` for pending
3. Add priority filter: `AND priority = :priority`
4. Add tag filter: `AND tags @> ARRAY[:tag]` (PostgreSQL array contains)
5. Add search: `AND (title ILIKE :search OR description ILIKE :search)`
6. Add overdue: `AND due_date < NOW() AND completed = FALSE`
7. Add date range: `AND due_date BETWEEN :due_after AND :due_before`
8. Apply sort with null handling for due_date

### 3.2 API Route Updates

**File**: `backend/src/api/tasks.py`

Add query parameters to `list_tasks` endpoint:

```python
@router.get("")
async def list_tasks(
    request: Request,
    session: DbSession,
    user_id: CurrentUserId,
    status: Optional[str] = Query(None, regex="^(pending|completed|all)$"),
    priority: Optional[str] = Query(None, regex="^(high|medium|low)$"),
    tag: Optional[list[str]] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    overdue: Optional[bool] = Query(None),
    due_before: Optional[str] = Query(None),
    due_after: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|due_date|priority|title)$"),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
) -> list[TaskRead]:
```

### 3.3 Validation Updates

**File**: `backend/src/models/task.py`

- `TaskCreate`: Add `priority`, `tags`, `due_date`, `remind_at`, `is_recurring`, `recurrence_pattern`, `recurrence_interval`
- `TaskUpdate`: Add same fields as optional
- `TaskRead`: Add all new fields
- Add Pydantic validators for priority enum, tag format, recurrence pattern

---

## 4. Phase 3: Frontend UI Updates

### 4.1 Types Update

**File**: `frontend/types/index.ts`

```typescript
export interface Task {
  // ... existing fields
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  dueDate: string | null;
  remindAt: string | null;
  reminderSent: boolean;
  isRecurring: boolean;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | null;
  recurrenceInterval: number;
  parentTaskId: string | null;
}

export type TaskSortField = 'createdAt' | 'title' | 'dueDate' | 'priority';

export type PriorityLevel = 'high' | 'medium' | 'low';
```

### 4.2 Component Updates

| Component | Changes |
|-----------|---------|
| `TaskCard.tsx` | Add priority badge, tag chips, due date display, overdue indicator, recurring icon |
| `TaskModal.tsx` | Add priority selector, tag input, date picker, recurrence toggle |
| `FilterSortBar.tsx` | Add priority filter, tag filter, search bar, due date sort, priority sort |
| `TaskList.tsx` | Pass new filter/sort params to API |
| `tasks/page.tsx` | Update stats for priority breakdown, add search state |

### 4.3 New Components

| Component | Purpose |
|-----------|---------|
| `PriorityBadge.tsx` | Color-coded priority badge (red/yellow/green) |
| `TagChip.tsx` | Tag display chip with remove button |
| `TagInput.tsx` | Tag input with autocomplete |
| `DatePicker.tsx` | Due date picker using native input |
| `RecurrenceSelector.tsx` | Recurrence pattern dropdown |
| `SearchBar.tsx` | Debounced search input |
| `WebSocketProvider.tsx` | WebSocket connection management (Context) |

### 4.4 API Client Updates

**File**: `frontend/lib/api.ts`

Update `fetchTasks()` to accept filter/sort/search params and build query string.

---

## 5. Phase 4: MCP Tools + Intent Analyzer

### 5.1 Updated MCP Tools

| Tool | Changes |
|------|---------|
| `add-task.ts` | Accept `priority`, `tags`, `due_date`, `is_recurring`, `recurrence_pattern` |
| `list-tasks.ts` | Accept `priority`, `tag`, `search`, `sort_by`, `sort_dir`, `overdue` |
| `update-task.ts` | Accept `priority`, `tags`, `due_date`, `remind_at` |
| `set-due-date.ts` | Update to use native `due_date` field instead of description hack |

### 5.2 New MCP Tools

| Tool | Purpose |
|------|---------|
| `set-priority.ts` | Set task priority level |
| `add-tags.ts` | Add tags to a task |
| `search-tasks.ts` | Search tasks by query |
| `set-recurring.ts` | Set task recurrence |

### 5.3 Intent Analyzer Updates

**File**: `frontend/lib/agents/intent-analyzer.ts`

Add new intent types and entity extraction:
- `set_priority`: Extract task_id and priority level
- `add_tags`: Extract task_id and tags array
- `search_tasks`: Extract search query
- `set_recurring`: Extract task_id, pattern, interval
- Enhanced `add_task`: Extract priority, tags, recurrence from natural language
- Enhanced `list_tasks`: Extract priority_filter, tag_filter, sort preferences

---

## 6. Phase 5: Kafka + Dapr + Event Publishing

### 6.1 Dapr Components

Create Dapr component YAML files in `dapr/components/`:
- `kafka-pubsub.yaml` - Kafka Pub/Sub component
- `statestore.yaml` - PostgreSQL state store
- `kubernetes-secrets.yaml` - K8s secrets store

### 6.2 Event Publisher Module

**File**: `backend/src/events/publisher.py`

```python
import httpx
from uuid import uuid4
from datetime import datetime

DAPR_URL = "http://localhost:3500"

async def publish_task_event(event_type: str, task_data: dict, user_id: str):
    event = {
        "event_id": str(uuid4()),
        "event_type": event_type,
        "task_id": str(task_data["id"]),
        "task_data": task_data,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    try:
        async with httpx.AsyncClient() as client:
            # Publish to task-events
            await client.post(f"{DAPR_URL}/v1.0/publish/kafka-pubsub/task-events", json=event)
            # Publish to task-updates (for real-time sync)
            await client.post(f"{DAPR_URL}/v1.0/publish/kafka-pubsub/task-updates", json=event)
    except Exception as e:
        logger.error(f"Event publish failed: {e}")
        # Log to fallback file for retry
```

### 6.3 Integration Points

Add event publishing to `TaskService` methods:
- `create_task()` → publish `created` event
- `update_task()` → publish `updated` event
- When `completed=True` → publish `completed` event
- `delete_task()` → publish `deleted` event
- When `remind_at` set → publish to `reminders` topic + schedule Dapr Job

---

## 7. Phase 6: 4 Microservices

### 7.1 Service Template

Each microservice follows the same FastAPI pattern:

```python
from fastapi import FastAPI
app = FastAPI(title="{Service Name}")

@app.get("/health")
async def health(): return {"status": "healthy"}

@app.post("/api/events/{topic}")
async def handle_event(request: Request):
    event = await request.json()
    # Process event
    return {"status": "SUCCESS"}
```

### 7.2 Build Order

1. **Audit Service** (simplest - just store events)
2. **Notification Service** (store + publish to WebSocket)
3. **Recurring Task Service** (store + create new task via API)
4. **WebSocket Service** (WebSocket connection management)

### 7.3 Dockerfiles

Each service gets a lightweight Python Dockerfile:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
EXPOSE 8080
```

---

## 8. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tag storage | PostgreSQL TEXT[] array | Simpler than junction table; GIN index for efficient filtering; no tag management needed |
| Search implementation | ILIKE (not tsvector) | Simpler for MVP; sufficient for < 10K tasks per user; upgradeable later |
| Priority storage | VARCHAR enum | Simpler than PostgreSQL enum type; easier to add levels later |
| Event publishing | Fire-and-forget with logging | CRUD operations must not be blocked by Kafka; events are eventually consistent |
| Microservice state | Dapr State Store | Consistent abstraction; no direct DB access from services |
| WebSocket auth | JWT token in connection URL | Standard approach for WebSocket authentication |

---

## 9. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Backend API | pytest + httpx | All new endpoints, filter/sort/search combinations |
| Frontend | Manual testing | Component rendering, user interactions |
| MCP Tools | Integration tests | New tool invocations via chatbot |
| Event Publishing | Mock Dapr sidecar | Verify event payloads and topics |
| Microservices | pytest per service | Handler logic, idempotency |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks existing tasks | High | All new columns have defaults; test migration on staging first |
| Dapr sidecar startup ordering | Medium | Health check loop; graceful degradation if sidecar not ready |
| Kafka topic creation | Medium | Auto-create topics on first publish; or pre-create in startup script |
| WebSocket connection limits | Low | Max 100 concurrent connections per user; connection pooling |

---

## 11. Follow-ups

1. **Performance**: If ILIKE search is slow, upgrade to `tsvector/tsquery` with GIN index
2. **Email notifications**: Add email adapter to Notification Service in Phase 5 Part C
3. **Tag management**: Add tag CRUD API for tag rename/delete across all tasks
