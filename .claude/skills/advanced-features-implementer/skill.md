# advanced-features-implementer Skill

This skill enhances the `advanced-features-implementer` agent's specialty.

## Agent Role:
The `advanced-features-implementer` is a specialized full-stack agent for implementing all advanced and intermediate level features for the Todo app. It works across frontend (Next.js), backend (FastAPI), and chatbot integration to deliver feature-complete functionality.

## Specialty:

### Advanced Level Features:

#### 1. Recurring Tasks
- Recurrence patterns: daily, weekly, monthly, custom
- Database: `is_recurring`, `recurrence_pattern`, `recurrence_interval` fields
- Backend: API for setting/updating recurrence
- Frontend: Recurrence selector in task modal
- Chat: "add a daily task to check emails"
- Event: Completion triggers next instance creation

#### 2. Due Dates & Reminders
- Database: `due_date`, `remind_at`, `reminder_sent` fields
- Backend: Due date and reminder API endpoints
- Frontend: Date picker, reminder selector, overdue indicators
- Chat: "set due date for task 5 to tomorrow"
- Event: Schedule reminder via Dapr Jobs API

### Intermediate Level Features:

#### 3. Priorities
- Levels: High (red), Medium (yellow), Low (green), default: Medium
- Color-coded badges, priority filter in UI
- Chat: "add high priority task: fix login bug"

#### 4. Tags
- Flexible tagging with `tags` array field
- Tag chips, autocomplete, filter by tags
- Chat: "add task 'review PR' with tags: work, urgent"

#### 5. Search
- Full-text search on title and description (PostgreSQL)
- Debounced search bar in UI
- Chat: "search for tasks about meeting"

#### 6. Filter
- By status, priority, tags, due date range
- Filter panel with active filter chips
- Chat: "show my high priority tasks"

#### 7. Sort
- By created date, due date, priority, alphabetical
- Sort dropdown in UI, ascending/descending
- Chat: "list tasks sorted by due date"

## Implementation Order:
1. Database schema → 2. Backend API → 3. Frontend UI → 4. MCP tools → 5. Intent analyzer → 6. Events

## Operational Guidelines:
- **Full-Stack**: Every feature end-to-end (DB → API → UI → Chat)
- **Backward Compatible**: Never break existing CRUD or chat
- **Event-Ready**: All features emit Kafka events via Dapr
- **MCP Integration**: Chat-accessible features get MCP tools
- **ADR Suggestions**: For tag storage, search implementation

## Output Format:
1. **Schema Changes**: SQLModel/Prisma model updates
2. **Backend Code**: FastAPI endpoint modifications
3. **Frontend Code**: React component updates
4. **MCP Tools**: New/updated tool definitions
5. **Tests**: Unit and integration tests

## Self-Verification:
Verify all new fields have defaults (no breaking changes), existing API tests still pass, and UI is responsive on mobile and desktop.
