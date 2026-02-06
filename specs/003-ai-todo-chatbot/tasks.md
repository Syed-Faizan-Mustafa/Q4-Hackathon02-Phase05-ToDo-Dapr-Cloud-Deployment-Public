# Tasks: AI Todo Chatbot with MCP Server

**Input**: Design documents from `/specs/003-ai-todo-chatbot/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and MCP SDK setup

- [X] T001 Install MCP SDK dependencies: `npm install @modelcontextprotocol/sdk` in `frontend/`
- [X] T002 [P] Install Cohere SDK: `npm install cohere-ai` in `frontend/`
- [X] T003 [P] Create MCP directory structure: `frontend/lib/mcp/`, `frontend/lib/mcp/tools/`
- [X] T004 [P] Create agents directory structure: `frontend/lib/agents/`
- [X] T005 [P] Add environment variables to `.env.local`: `COHERE_API_KEY`, `NEXT_PUBLIC_API_URL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### MCP Server Core

- [X] T006 Create MCP type definitions in `frontend/lib/mcp/types.ts` (MCPTool, MCPToolResult, MCPContext)
- [X] T007 Create MCP Server base in `frontend/lib/mcp/server.ts` with tool registry pattern
- [X] T008 Create MCP Client in `frontend/lib/mcp/client.ts` for JSON-RPC tool invocation
- [X] T009 Create backend API client in `frontend/lib/utils/backend-client.ts` for Phase II REST API

### Agent System Core

- [X] T010 Create agent type definitions in `frontend/lib/agents/types.ts` (ChatIntent, ChatMessage, AgentResult)
- [X] T011 Create Cohere adapter in `frontend/lib/agents/cohere-adapter.ts` with temperature config
- [X] T012 Create orchestrator agent in `frontend/lib/agents/orchestrator.ts` (entry point)
- [X] T013 Create intent-analyzer agent in `frontend/lib/agents/intent-analyzer.ts` (Cohere temp 0.3)
- [X] T014 Create mcp-tool-executor agent in `frontend/lib/agents/mcp-tool-executor.ts`
- [X] T015 Create response-composer agent in `frontend/lib/agents/response-composer.ts` (Cohere temp 0.7)

### Chat API Endpoint

- [X] T016 Create chat API route in `frontend/app/api/chat/route.ts` with POST handler
- [X] T017 Add JWT token extraction and validation in chat API route
- [X] T018 Add request timeout handling (10 second limit) in chat API route

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Open and Close Chatbot (Priority: P1)

**Goal**: Users can see floating chat icon and open/close chatbot window

**Independent Test**: Log in, see chat icon, click to open, click to close - delivers basic chatbot accessibility

### Implementation for User Story 1

- [X] T019 [P] [US1] Create ChatWidget component in `frontend/components/chat/ChatWidget.tsx` (floating icon 60x60px)
- [X] T020 [P] [US1] Create ChatWindow component in `frontend/components/chat/ChatWindow.tsx` (400x500px desktop)
- [X] T021 [P] [US1] Create ChatBubble component in `frontend/components/chat/ChatBubble.tsx` (left/right alignment)
- [X] T022 [P] [US1] Create ChatMessage component in `frontend/components/chat/ChatMessage.tsx`
- [X] T023 [P] [US1] Create ChatInput component in `frontend/components/chat/ChatInput.tsx` (input + send button)
- [X] T024 [P] [US1] Create TypingIndicator component in `frontend/components/chat/TypingIndicator.tsx`
- [X] T025 [US1] Create useChat hook in `frontend/hooks/useChat.ts` (session state, messages, loading)
- [X] T026 [US1] Add slide-up animation for chat window open/close (FR-002, FR-003)
- [X] T027 [US1] Add mobile responsive layout (full-width under 640px) (FR-005)
- [X] T028 [US1] Add welcome message display when chat opens (FR-014a)
- [X] T029 [US1] Add keyboard navigation: Tab, Enter, Escape handlers (FR-013)
- [X] T030 [US1] Add ARIA labels for accessibility (FR-014)
- [X] T031 [US1] Integrate ChatWidget into authenticated layout (show only when logged in) (FR-031)

**Checkpoint**: User Story 1 complete - chatbot opens/closes with proper UI

---

## Phase 4: User Story 2 - Add Task via Conversation (Priority: P2)

**Goal**: Users can add tasks by typing natural language like "Add buy groceries"

**Independent Test**: Open chatbot, type "Add buy groceries", verify task appears in task list

### MCP Tool for User Story 2

- [X] T032 [US2] Create add_task MCP tool in `frontend/lib/mcp/tools/add-task.ts` per mcp-tools.json schema

### Implementation for User Story 2

- [X] T033 [US2] Add "add_task" intent recognition in intent-analyzer (FR-015)
- [X] T034 [US2] Implement add_task tool handler calling Phase II POST /tasks endpoint
- [X] T035 [US2] Add confirmation response generation for task creation (FR-036, FR-039)
- [X] T036 [US2] Add error handling for failed task creation (FR-040)
- [X] T037 [US2] Connect add_task flow: orchestrator → intent-analyzer → mcp-executor → response-composer

**Checkpoint**: User Story 2 complete - tasks can be added via conversation

---

## Phase 5: User Story 3 - List Tasks via Conversation (Priority: P3)

**Goal**: Users can ask chatbot to show their tasks

**Independent Test**: Open chatbot, type "Show my tasks", see list of tasks

### MCP Tool for User Story 3

- [X] T038 [US3] Create list_tasks MCP tool in `frontend/lib/mcp/tools/list-tasks.ts` per mcp-tools.json schema

### Implementation for User Story 3

- [X] T039 [US3] Add "list_tasks" intent recognition in intent-analyzer (FR-016)
- [X] T040 [US3] Implement list_tasks tool handler calling Phase II GET /tasks endpoint
- [X] T041 [US3] Add status_filter entity extraction (pending/completed/all)
- [X] T042 [US3] Format task list response (max 10 tasks with "show more" prompt) (FR-025a)
- [X] T043 [US3] Add friendly response for empty task list (FR-037)
- [X] T044 [US3] Connect list_tasks flow through agent pipeline

**Checkpoint**: User Story 3 complete - tasks can be listed via conversation

---

## Phase 6: User Story 4 - Complete Task via Conversation (Priority: P4)

**Goal**: Users can mark tasks as complete by telling the chatbot

**Independent Test**: Have pending task, say "Complete task 1", verify task shows as completed

### MCP Tool for User Story 4

- [X] T045 [US4] Create complete_task MCP tool in `frontend/lib/mcp/tools/complete-task.ts` per mcp-tools.json schema

### Implementation for User Story 4

- [X] T046 [US4] Add "complete_task" intent recognition in intent-analyzer (FR-017)
- [X] T047 [US4] Implement task_id entity extraction from message
- [X] T048 [US4] Implement complete_task tool handler calling Phase II PATCH /tasks/{id} endpoint
- [X] T049 [US4] Add confirmation response for task completion (FR-036)
- [X] T050 [US4] Add error handling for non-existent task (FR-023)
- [X] T051 [US4] Connect complete_task flow through agent pipeline

**Checkpoint**: User Story 4 complete - tasks can be completed via conversation

---

## Phase 7: User Story 5 - Update Task via Conversation (Priority: P5)

**Goal**: Users can update task details through conversation

**Independent Test**: Have task, say "Change task 1 title to new title", verify update

### MCP Tool for User Story 5

- [X] T052 [US5] Create update_task MCP tool in `frontend/lib/mcp/tools/update-task.ts` per mcp-tools.json schema

### Implementation for User Story 5

- [X] T053 [US5] Add "update_task" intent recognition in intent-analyzer (FR-018)
- [X] T054 [US5] Implement title and description entity extraction
- [X] T055 [US5] Implement update_task tool handler calling Phase II PATCH /tasks/{id} endpoint
- [X] T056 [US5] Add confirmation response for task update (FR-036)
- [X] T057 [US5] Add error handling for non-existent task (FR-042)
- [X] T058 [US5] Connect update_task flow through agent pipeline

**Checkpoint**: User Story 5 complete - tasks can be updated via conversation

---

## Phase 8: User Story 6 - Delete Task via Conversation (Priority: P6)

**Goal**: Users can delete tasks by telling the chatbot

**Independent Test**: Have task, say "Delete task 1", verify task removed

### MCP Tool for User Story 6

- [X] T059 [US6] Create delete_task MCP tool in `frontend/lib/mcp/tools/delete-task.ts` per mcp-tools.json schema

### Implementation for User Story 6

- [X] T060 [US6] Add "delete_task" intent recognition in intent-analyzer (FR-019)
- [X] T061 [US6] Implement delete_task tool handler calling Phase II DELETE /tasks/{id} endpoint
- [X] T062 [US6] Add confirmation response for task deletion (FR-036)
- [X] T063 [US6] Add error handling for non-existent task (FR-042)
- [X] T064 [US6] Connect delete_task flow through agent pipeline

**Checkpoint**: User Story 6 complete - tasks can be deleted via conversation

---

## Phase 9: User Story 7 - Set Due Date via Conversation (Priority: P7)

**Goal**: Users can set or update due dates for tasks through conversation

**Independent Test**: Have task, say "Set task 1 due tomorrow", verify due date is set

### MCP Tool for User Story 7

- [X] T065 [US7] Create set_due_date MCP tool in `frontend/lib/mcp/tools/set-due-date.ts` per mcp-tools.json schema

### Implementation for User Story 7

- [X] T066 [US7] Add "set_due_date" intent recognition in intent-analyzer (FR-020)
- [X] T067 [US7] Implement due_date entity extraction with natural language parsing ("tomorrow", "January 15")
- [X] T068 [US7] Add "get_task_dates" intent recognition in intent-analyzer (FR-021)
- [X] T069 [US7] Implement set_due_date tool handler calling Phase II PATCH /tasks/{id} endpoint
- [X] T070 [US7] Add confirmation response for due date setting (FR-036)
- [X] T071 [US7] Connect set_due_date flow through agent pipeline

**Checkpoint**: User Story 7 complete - due dates can be set via conversation

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T072 [P] Add MCP tool invocation logging (FR-051) in `frontend/lib/mcp/server.ts`
- [X] T073 [P] Add 30-second cooldown for LLM rate limiting (FR-043) in cohere-adapter.ts
- [X] T074 [P] Add session expiry handling (FR-035) in useChat.ts
- [X] T075 [P] Add ambiguous request clarification (FR-023) in intent-analyzer.ts
- [X] T076 [P] Add multi-task match disambiguation in intent-analyzer.ts
- [X] T077 [P] Add 1000 character message truncation in chat API route
- [X] T078 [P] Add auto-scroll behavior for new messages (FR-009) in ChatWindow.tsx
- [X] T079 Run quickstart.md validation steps
- [X] T080 Verify all FR requirements in checklists/requirements.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6 → P7)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **US2 (P2)**: Can start after Foundational - Uses add_task MCP tool
- **US3 (P3)**: Can start after Foundational - Uses list_tasks MCP tool
- **US4 (P4)**: Can start after Foundational - Uses complete_task MCP tool
- **US5 (P5)**: Can start after Foundational - Uses update_task MCP tool
- **US6 (P6)**: Can start after Foundational - Uses delete_task MCP tool
- **US7 (P7)**: Can start after Foundational - Uses set_due_date MCP tool

### Within Each User Story

- MCP tool creation before handler implementation
- Intent recognition before tool execution
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All UI components marked [P] in US1 can run in parallel
- All MCP tools can be created in parallel once Phase 2 is done
- All Polish tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1-2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Chat UI)
4. Complete Phase 4: User Story 2 (Add Task)
5. **STOP and VALIDATE**: Basic chatbot that can add tasks
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Chat UI) → Test independently → Chatbot visible
3. Add US2 (Add Task) → Test independently → MVP!
4. Add US3 (List Tasks) → Test independently
5. Add US4-US7 → Complete CRUD functionality
6. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All MCP tools follow schemas defined in `contracts/mcp-tools.json`
- All agents follow contracts defined in `contracts/agent-contracts.json`
