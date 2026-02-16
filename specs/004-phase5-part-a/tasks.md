# Tasks: Phase 5 Part A - Advanced Features + Event-Driven Architecture

**Feature**: 004-phase5-part-a
**Date**: 2026-02-12
**Plan Reference**: `specs/004-phase5-part-a/plan.md`

---

## Phase 1: Database Schema Evolution

### T001: Update SQLModel Task Models
**Blocked by**: None
**Priority**: P1

**Description**: Add all new fields to the Task, TaskCreate, TaskUpdate, and TaskRead models in `backend/src/models/task.py`.

**Changes**:
- Add `priority` (str, default "medium"), `tags` (list[str], default []), `due_date` (Optional[datetime]), `remind_at` (Optional[datetime]), `reminder_sent` (bool, default False), `is_recurring` (bool, default False), `recurrence_pattern` (Optional[str]), `recurrence_interval` (int, default 1), `parent_task_id` (Optional[UUID]) to `Task` model
- Add corresponding fields to `TaskCreate` (all optional except priority default)
- Add corresponding fields to `TaskUpdate` (all optional)
- Add all fields to `TaskRead` response schema
- Add Pydantic validators for priority enum, tags format, recurrence pattern

**Acceptance**:
- [ ] Task model has all 9 new fields with correct types and defaults
- [ ] TaskCreate accepts new fields with validation
- [ ] TaskUpdate allows partial updates on new fields
- [ ] TaskRead returns all new fields
- [ ] Priority only accepts "high", "medium", "low"
- [ ] Tags validated: max 10 items, each max 30 chars, alphanumeric + hyphens

---

### T002: Create Database Migration
**Blocked by**: T001
**Priority**: P1

**Description**: Create SQL migration `002_phase5_advanced_features.sql` to add new columns, constraints, and indexes to the tasks table.

**Changes**:
- ALTER TABLE for all 9 new columns with defaults
- CHECK constraints for priority, recurrence_pattern, recurrence_interval, tags_length
- New indexes: priority, due_date, tags (GIN), recurring

**Acceptance**:
- [ ] Migration runs without errors on existing database
- [ ] Existing tasks get default values (priority=medium, tags=[], etc.)
- [ ] All constraints enforce valid data
- [ ] Indexes created for query performance
- [ ] Rollback migration defined

---

### T003: Migrate Existing Due Dates from Description
**Blocked by**: T002
**Priority**: P2

**Description**: Create a one-time data migration to move due dates from task descriptions (📅 Due: ...) to the new `due_date` column.

**Acceptance**:
- [ ] Existing tasks with "📅 Due:" in description have due_date populated
- [ ] Description field is cleaned (📅 Due: line removed)
- [ ] Tasks without due date in description are unchanged

---

## Phase 2: Backend API Enhancement

### T004: Enhance Task Service with Filter/Sort/Search
**Blocked by**: T002
**Priority**: P1

**Description**: Update `backend/src/services/task_service.py` `get_tasks()` to accept and apply filter, sort, and search parameters.

**Changes**:
- Add parameters: status, priority, tags, search, overdue, due_before, due_after, sort_by, sort_dir
- Build dynamic SQLAlchemy query with conditions
- Handle ILIKE search on title + description
- Handle tag filter with PostgreSQL array contains (`@>`)
- Handle priority sort order (high=3, medium=2, low=1)
- Handle null due_date sort placement

**Acceptance**:
- [ ] Filter by status (pending/completed/all) works
- [ ] Filter by priority works
- [ ] Filter by tag works (single and multiple)
- [ ] ILIKE search on title + description works
- [ ] Overdue filter works (due_date < now AND not completed)
- [ ] Date range filter works
- [ ] Sort by created_at, due_date, priority, title works
- [ ] Sort direction (asc/desc) works
- [ ] Combined filters + sort work together

---

### T005: Update Task API Routes with Query Parameters
**Blocked by**: T004
**Priority**: P1

**Description**: Update `backend/src/api/tasks.py` list_tasks endpoint to accept new query parameters.

**Changes**:
- Add Query parameters: status, priority, tag (list), search, overdue, due_before, due_after, sort_by, sort_dir
- Pass parameters to TaskService.get_tasks()
- Update OpenAPI docs for new parameters

**Acceptance**:
- [ ] GET /api/v1/tasks accepts all new query parameters
- [ ] Invalid parameter values return 422 validation error
- [ ] Default behavior unchanged (created_at desc, no filters)

---

### T006: Update Create/Update Task for New Fields
**Blocked by**: T001
**Priority**: P1

**Description**: Ensure POST and PATCH endpoints accept and process new fields (priority, tags, due_date, remind_at, is_recurring, recurrence_pattern, recurrence_interval).

**Changes**:
- TaskCreate and TaskUpdate schemas already updated in T001
- Ensure `create_task()` and `update_task()` in service handle new fields
- Validate recurrence requires is_recurring=true

**Acceptance**:
- [ ] POST /api/v1/tasks creates task with priority, tags, due_date
- [ ] PATCH /api/v1/tasks/{id} updates priority, tags, due_date
- [ ] Setting recurrence fields works correctly
- [ ] Invalid priority/tags/dates rejected with clear error

---

## Phase 3: Frontend UI Updates

### T007: Update TypeScript Types
**Blocked by**: None
**Priority**: P1

**Description**: Update `frontend/types/index.ts` with new Task fields and types.

**Changes**:
- Add new fields to Task interface
- Add PriorityLevel type
- Update TaskSortField with new options
- Add TaskFilterState for new filter criteria
- Update CreateTaskRequest, UpdateTaskRequest

**Acceptance**:
- [ ] Task interface has all new fields
- [ ] PriorityLevel type exists: 'high' | 'medium' | 'low'
- [ ] TaskSortField includes: 'dueDate' | 'priority'

---

### T008: Create Priority Badge Component
**Blocked by**: T007
**Priority**: P1

**Description**: Create `frontend/components/ui/PriorityBadge.tsx` - a color-coded badge for priority display.

**Acceptance**:
- [ ] High = red badge, Medium = yellow badge, Low = green badge
- [ ] Matches existing badge design system
- [ ] Accessible with aria-label

---

### T009: Create Tag Components (TagChip + TagInput)
**Blocked by**: T007
**Priority**: P2

**Description**: Create `frontend/components/ui/TagChip.tsx` and `frontend/components/ui/TagInput.tsx`.

**Acceptance**:
- [ ] TagChip displays tag with optional remove button
- [ ] TagInput allows typing new tags with Enter to add
- [ ] TagInput shows autocomplete suggestions from existing tags
- [ ] Maximum 10 tags enforced in UI

---

### T010: Create Search Bar Component
**Blocked by**: T007
**Priority**: P1

**Description**: Create `frontend/components/SearchBar.tsx` with debounced input.

**Acceptance**:
- [ ] Debounce 300ms before triggering search
- [ ] Shows search icon and clear button
- [ ] Matches existing design system

---

### T011: Update TaskCard with New Features
**Blocked by**: T008, T009
**Priority**: P1

**Description**: Update `frontend/components/TaskCard.tsx` to display priority badge, tags, due date, overdue indicator, and recurring icon.

**Acceptance**:
- [ ] Priority badge displayed on each card
- [ ] Tags shown as chips below title
- [ ] Due date displayed with calendar icon
- [ ] Overdue tasks show red "Overdue" badge
- [ ] Recurring tasks show repeat icon

---

### T012: Update TaskModal with New Fields
**Blocked by**: T008, T009
**Priority**: P1

**Description**: Update `frontend/components/TaskModal.tsx` to include priority selector, tag input, date picker, and recurrence toggle.

**Acceptance**:
- [ ] Priority dropdown (High/Medium/Low) in create/edit modal
- [ ] Tag input with autocomplete
- [ ] Date picker for due date
- [ ] Recurrence toggle with pattern selector (daily/weekly/monthly)
- [ ] All new fields submitted to API

---

### T013: Update FilterSortBar with New Options
**Blocked by**: T010
**Priority**: P1

**Description**: Update `frontend/components/FilterSortBar.tsx` to include priority filter, tag filter, search bar, and new sort options.

**Acceptance**:
- [ ] Priority filter pills (All/High/Medium/Low)
- [ ] Tag filter dropdown
- [ ] Search bar integrated
- [ ] Sort options: Created Date, Due Date, Priority, Title
- [ ] Active filters shown as removable chips

---

### T014: Update Tasks Page with New Filter/Sort State
**Blocked by**: T013
**Priority**: P1

**Description**: Update `frontend/app/tasks/page.tsx` to manage new filter/sort/search state and pass to API.

**Changes**:
- Add state for priority filter, tag filter, search query
- Update `fetchTasks()` to build query string with all params
- Update stats dashboard with priority breakdown

**Acceptance**:
- [ ] Filter/sort/search state management works
- [ ] API called with correct query parameters
- [ ] Stats show priority breakdown (High: X, Medium: Y, Low: Z)

---

### T015: Update API Client with Filter/Sort/Search
**Blocked by**: T007
**Priority**: P1

**Description**: Update `frontend/lib/api.ts` to build query strings for the enhanced list endpoint.

**Acceptance**:
- [ ] fetchTasks() accepts filter/sort/search params
- [ ] Query string correctly built with all parameters
- [ ] Empty filters omitted from query string

---

## Phase 4: MCP Tools + Intent Analyzer

### T016: Update Existing MCP Tools for New Fields
**Blocked by**: T006
**Priority**: P1

**Description**: Update `add-task.ts`, `list-tasks.ts`, `update-task.ts`, `set-due-date.ts` to use new API fields.

**Changes**:
- `add-task.ts`: Accept priority, tags, due_date, recurrence params; send to backend directly
- `list-tasks.ts`: Accept priority, tag, search, sort_by, sort_dir, overdue; pass as query params
- `update-task.ts`: Accept priority, tags, due_date, remind_at
- `set-due-date.ts`: Use native `due_date` field instead of description hack

**Acceptance**:
- [ ] add_task creates tasks with priority, tags, due_date
- [ ] list_tasks filters/sorts/searches correctly
- [ ] update_task modifies new fields
- [ ] set_due_date updates due_date field (not description)

---

### T017: Create New MCP Tools
**Blocked by**: T016
**Priority**: P2

**Description**: Create 4 new MCP tools: `set-priority.ts`, `add-tags.ts`, `search-tasks.ts`, `set-recurring.ts`.

**Changes**:
- Register tools in `frontend/lib/mcp/server.ts`
- Each tool with inputSchema, handler function
- Integration with backend API

**Acceptance**:
- [ ] set_priority changes task priority via PATCH
- [ ] add_tags adds tags to task via PATCH
- [ ] search_tasks returns matching tasks via GET with search param
- [ ] set_recurring sets recurrence fields via PATCH
- [ ] All tools registered in MCP server

---

### T018: Update Intent Analyzer
**Blocked by**: T017
**Priority**: P1

**Description**: Update `frontend/lib/agents/intent-analyzer.ts` to recognize new intents and extract new entities.

**Changes**:
- Add new intent types: set_priority, add_tags, search_tasks, set_recurring
- Add pattern matching for new intents
- Enhance add_task extraction: priority, tags, recurrence
- Enhance list_tasks extraction: priority_filter, tag_filter, sort preferences
- Update INTENT_ANALYZER_PREAMBLE with new examples

**Acceptance**:
- [ ] "set task 5 to high priority" → set_priority intent
- [ ] "tag task 3 as work, urgent" → add_tags intent
- [ ] "search for meeting tasks" → search_tasks intent
- [ ] "make task daily" → set_recurring intent
- [ ] "add high priority task: fix bug" → add_task with priority=high
- [ ] "show high priority tasks sorted by due date" → list_tasks with filters

---

### T019: Update MCP Tool Executor
**Blocked by**: T017
**Priority**: P1

**Description**: Update `frontend/lib/agents/mcp-tool-executor.ts` to handle new tool invocations.

**Acceptance**:
- [ ] Routes set_priority intent to set_priority tool
- [ ] Routes add_tags intent to add_tags tool
- [ ] Routes search_tasks intent to search_tasks tool
- [ ] Routes set_recurring intent to set_recurring tool

---

### T020: Update Response Composer
**Blocked by**: T019
**Priority**: P2

**Description**: Update `frontend/lib/agents/response-composer.ts` to generate friendly responses for new operations.

**Acceptance**:
- [ ] Priority change confirmed: "Set task 'X' to high priority"
- [ ] Tags added confirmed: "Added tags [work, urgent] to task 'X'"
- [ ] Search results formatted nicely
- [ ] Recurring set confirmed: "Task 'X' will now repeat daily"

---

## Phase 5: Kafka + Dapr + Event Publishing

### T021: Create Dapr Component YAML Files
**Blocked by**: None
**Priority**: P1

**Description**: Create Dapr component configuration files for Pub/Sub, State Store, and Secrets.

**Files**:
- `dapr/components/kafka-pubsub.yaml`
- `dapr/components/statestore.yaml`
- `dapr/components/kubernetes-secrets.yaml`

**Acceptance**:
- [ ] kafka-pubsub component configured for local Kafka broker
- [ ] statestore component configured for PostgreSQL
- [ ] kubernetes-secrets component configured
- [ ] All components follow Dapr v1 API spec

---

### T022: Create Event Publisher Module
**Blocked by**: T021
**Priority**: P1

**Description**: Create `backend/src/events/publisher.py` with functions to publish events via Dapr Pub/Sub HTTP API.

**Functions**:
- `publish_task_event(event_type, task_data, user_id)` → publishes to `task-events` and `task-updates`
- `publish_reminder_event(task_data, user_id)` → publishes to `reminders`
- `schedule_reminder_job(task_id, remind_at, user_id)` → schedules via Dapr Jobs API

**Acceptance**:
- [ ] Events published to correct topics via Dapr HTTP API
- [ ] Event payloads match schema (event_id, event_type, task_data, user_id, timestamp)
- [ ] Publish failures logged but don't block response
- [ ] Configurable DAPR_URL (default: http://localhost:3500)

---

### T023: Integrate Event Publishing into Task Service
**Blocked by**: T022
**Priority**: P1

**Description**: Add event publishing calls to `TaskService` methods in `backend/src/services/task_service.py`.

**Changes**:
- `create_task()` → publish `created` event after DB commit
- `update_task()` → publish `updated` event; if `completed=True`, publish `completed` event
- `delete_task()` → publish `deleted` event after DB commit
- When `remind_at` is set → publish reminder event + schedule Dapr Job

**Acceptance**:
- [ ] Every CRUD operation publishes the correct event type
- [ ] Completion triggers `completed` event (for recurring task processing)
- [ ] Setting remind_at triggers reminder event + job scheduling
- [ ] Events don't block HTTP response

---

## Phase 6: 4 Microservices

### T024: Create Audit Service
**Blocked by**: T023
**Priority**: P1

**Description**: Build the Audit Service that subscribes to `task-events` and stores all events as immutable records.

**Files**: `services/audit-service/`

**Acceptance**:
- [ ] Subscribes to `task-events` topic via Dapr Pub/Sub
- [ ] Stores every event in Dapr State Store (append-only)
- [ ] GET /api/audit/{user_id} returns audit trail
- [ ] GET /api/audit/{user_id}/task/{task_id} returns task-specific audit
- [ ] GET /health returns healthy
- [ ] Dockerfile builds successfully
- [ ] Idempotent: duplicate events (same event_id) ignored

---

### T025: Create Notification Service
**Blocked by**: T023
**Priority**: P2

**Description**: Build the Notification Service that subscribes to `reminders` and generates in-app notifications.

**Files**: `services/notification-service/`

**Acceptance**:
- [ ] Subscribes to `reminders` topic via Dapr Pub/Sub
- [ ] Processes reminder events and stores notification
- [ ] Publishes notification to `task-updates` topic (for WebSocket delivery)
- [ ] Tracks delivery status (pending/sent/failed)
- [ ] GET /health returns healthy
- [ ] Dockerfile builds successfully

---

### T026: Create Recurring Task Service
**Blocked by**: T023
**Priority**: P2

**Description**: Build the Recurring Task Service that subscribes to `task-events`, detects completed recurring tasks, and creates next occurrences.

**Files**: `services/recurring-task-service/`

**Acceptance**:
- [ ] Subscribes to `task-events` topic via Dapr Pub/Sub
- [ ] Filters for `completed` events where is_recurring=true
- [ ] Calculates next due date: daily (+N days), weekly (+N*7 days), monthly (+N months)
- [ ] Creates next task via Backend REST API (Dapr Service Invocation)
- [ ] Publishes `created` event for new task
- [ ] GET /health returns healthy
- [ ] Dockerfile builds successfully

---

### T027: Create WebSocket Service
**Blocked by**: T023
**Priority**: P3

**Description**: Build the WebSocket Service that subscribes to `task-updates` and broadcasts to connected clients.

**Files**: `services/websocket-service/`

**Acceptance**:
- [ ] Subscribes to `task-updates` topic via Dapr Pub/Sub
- [ ] Maintains WebSocket connections per user
- [ ] WS /ws/{user_id} accepts WebSocket connections with JWT auth
- [ ] Broadcasts task changes to all connected clients of same user
- [ ] Heartbeat every 30 seconds
- [ ] GET /health returns healthy
- [ ] Dockerfile builds successfully

---

### T028: Add WebSocket Client to Frontend
**Blocked by**: T027
**Priority**: P3

**Description**: Create `frontend/components/WebSocketProvider.tsx` that connects to the WebSocket Service and updates task list in real-time.

**Acceptance**:
- [ ] WebSocket connection established on task page load
- [ ] Task list updates automatically on receiving events
- [ ] Reconnection logic on disconnect
- [ ] Connection status indicator in UI

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1. Database | T001-T003 | P1-P2 |
| 2. Backend API | T004-T006 | P1 |
| 3. Frontend UI | T007-T015 | P1-P2 |
| 4. MCP + Intent | T016-T020 | P1-P2 |
| 5. Kafka + Dapr | T021-T023 | P1 |
| 6. Microservices | T024-T028 | P1-P3 |

**Total**: 28 tasks across 6 phases
**Critical Path**: T001 → T002 → T004 → T005 → T006 (Database → Backend API must complete before everything else)
