# Tasks: AI Todo Chatbot

**Input**: Design documents from `/specs/003-ai-todo-chatbot/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are optional for this feature. Unit tests included in Polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` at repository root (extends existing Phase II structure)
- Components: `frontend/components/chat/`
- API routes: `frontend/app/api/chat/`
- Agent logic: `frontend/lib/agents/`
- Hooks: `frontend/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and chatbot directory structure

- [X] T001 Create chat components directory structure at frontend/components/chat/
- [X] T002 Create agents directory structure at frontend/lib/agents/
- [X] T003 [P] Add COHERE_API_KEY and chatbot env vars to frontend/.env.example
- [X] T004 [P] Create shared types file at frontend/lib/agents/types.ts with all TypeScript interfaces from data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement Cohere API adapter with error handling at frontend/lib/agents/cohere-adapter.ts
- [X] T006 [P] Create useChat hook with state management at frontend/hooks/useChat.ts
- [X] T007 Implement todo-orchestrator agent at frontend/lib/agents/orchestrator.ts
- [X] T008 [P] Implement intent-analyzer agent with prompt template at frontend/lib/agents/intent-analyzer.ts
- [X] T009 [P] Implement tool-executor agent for backend API calls at frontend/lib/agents/tool-executor.ts
- [X] T010 [P] Implement response-composer agent at frontend/lib/agents/response-composer.ts
- [X] T011 Create chat API route with authentication at frontend/app/api/chat/route.ts
- [X] T012 Create barrel export for agents at frontend/lib/agents/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Open and Close Chatbot (Priority: P1) MVP

**Goal**: Display floating chat bubble icon and enable open/close/minimize functionality

**Independent Test**: Log in, see chat icon, click to open, click close or press Escape to close, verify minimize works

### Implementation for User Story 1

- [X] T013 [P] [US1] Create ChatBubble component (60x60px floating icon) at frontend/components/chat/ChatBubble.tsx
- [X] T014 [P] [US1] Create ChatWindow component (400x500px container) at frontend/components/chat/ChatWindow.tsx
- [X] T015 [US1] Create ChatWidget container component at frontend/components/chat/ChatWidget.tsx (depends on T013, T014)
- [X] T016 [US1] Add CSS transitions for slide-up/fade animation in ChatWindow.tsx
- [X] T017 [US1] Implement Escape key handler to close chat window in ChatWidget.tsx
- [X] T018 [US1] Add minimize/close buttons to ChatWindow header
- [X] T019 [US1] Implement mobile responsive styles (full-width under 640px) in ChatWindow.tsx
- [X] T020 [US1] Add ARIA labels and keyboard navigation support (Tab, Enter, Escape)
- [X] T021 [US1] Create barrel export at frontend/components/chat/index.ts
- [X] T022 [US1] Add ChatWidget to app layout at frontend/app/layout.tsx (authenticated pages only)

**Checkpoint**: User Story 1 complete - chatbot UI opens/closes on all authenticated pages

---

## Phase 4: User Story 2 - Add Task via Conversation (Priority: P2)

**Goal**: Enable users to add tasks through natural language messages like "Add buy groceries"

**Independent Test**: Open chatbot, type "Add buy groceries", verify typing indicator, confirmation message, and task appears in task list

### Implementation for User Story 2

- [X] T023 [P] [US2] Create ChatMessage component with user/assistant styling at frontend/components/chat/ChatMessage.tsx
- [X] T024 [P] [US2] Create ChatInput component with send button at frontend/components/chat/ChatInput.tsx
- [X] T025 [P] [US2] Create TypingIndicator component at frontend/components/chat/TypingIndicator.tsx
- [X] T026 [US2] Integrate ChatMessage, ChatInput, TypingIndicator into ChatWindow.tsx
- [X] T027 [US2] Wire ChatInput to useChat hook sendMessage function
- [X] T028 [US2] Add add_task intent recognition in intent-analyzer.ts (patterns: "Add [task]", "Create task: [task]")
- [X] T029 [US2] Add createTask function to tool-executor.ts (POST /api/{user_id}/tasks)
- [X] T030 [US2] Add friendly add_task response template to response-composer.ts
- [X] T031 [US2] Implement welcome message display when chat first opens (FR-014a)
- [X] T032 [US2] Add auto-scroll to latest message in ChatWindow.tsx

**Checkpoint**: User Story 2 complete - can add tasks via conversation

---

## Phase 5: User Story 3 - List Tasks via Conversation (Priority: P3)

**Goal**: Enable users to view their tasks by asking "Show my tasks" or "What tasks are pending?"

**Independent Test**: Open chatbot, type "Show my tasks", verify tasks are displayed with titles and status

### Implementation for User Story 3

- [X] T033 [US3] Add list_tasks intent recognition in intent-analyzer.ts (patterns: "Show my tasks", "What tasks are pending?")
- [X] T034 [US3] Add getTasks function to tool-executor.ts (GET /api/{user_id}/tasks with filters)
- [X] T035 [US3] Add task list formatting in response-composer.ts (max 10 tasks, "show more" prompt)
- [X] T036 [US3] Add status_filter entity extraction in intent-analyzer.ts (pending/completed/all)
- [X] T037 [US3] Handle empty task list with friendly message in response-composer.ts

**Checkpoint**: User Story 3 complete - can list tasks via conversation

---

## Phase 6: User Story 4 - Complete Task via Conversation (Priority: P4)

**Goal**: Enable users to mark tasks complete by saying "Mark task 3 done" or "Complete buy groceries"

**Independent Test**: Have a pending task, type "Mark task 3 done", verify confirmation and task status changes

### Implementation for User Story 4

- [X] T038 [US4] Add complete_task intent recognition in intent-analyzer.ts (patterns: "Mark task [id] done", "Complete [name]")
- [X] T039 [US4] Add task_id and task_name entity extraction in intent-analyzer.ts
- [X] T040 [US4] Add completeTask function to tool-executor.ts (PUT /api/{user_id}/tasks/{id})
- [X] T041 [US4] Add friendly complete_task response template to response-composer.ts
- [X] T042 [US4] Handle task not found error with helpful message

**Checkpoint**: User Story 4 complete - can complete tasks via conversation

---

## Phase 7: User Story 5 - Update Task via Conversation (Priority: P5)

**Goal**: Enable users to update task details by saying "Change task 5 title to..."

**Independent Test**: Have a task, type "Change task 5 title to new title", verify task is updated

### Implementation for User Story 5

- [X] T043 [US5] Add update_task intent recognition in intent-analyzer.ts (patterns: "Change task [id] title to...", "Update description of...")
- [X] T044 [US5] Add title and description field extraction in intent-analyzer.ts
- [X] T045 [US5] Add updateTask function to tool-executor.ts (PUT /api/{user_id}/tasks/{id})
- [X] T046 [US5] Add friendly update_task response template to response-composer.ts

**Checkpoint**: User Story 5 complete - can update tasks via conversation

---

## Phase 8: User Story 6 - Delete Task via Conversation (Priority: P6)

**Goal**: Enable users to delete tasks by saying "Delete task 7" or "Remove finish report"

**Independent Test**: Have a task, type "Delete task 7", verify confirmation and task is removed

### Implementation for User Story 6

- [X] T047 [US6] Add delete_task intent recognition in intent-analyzer.ts (patterns: "Delete task [id]", "Remove [name]")
- [X] T048 [US6] Add deleteTask function to tool-executor.ts (DELETE /api/{user_id}/tasks/{id})
- [X] T049 [US6] Add friendly delete_task response template to response-composer.ts
- [X] T050 [US6] Handle task not found error with helpful message

**Checkpoint**: User Story 6 complete - can delete tasks via conversation

---

## Phase 9: User Story 7 - Set Due Date via Conversation (Priority: P7)

**Goal**: Enable users to set/query due dates by saying "Set task 2 due tomorrow" or "When is task 3 due?"

**Independent Test**: Have a task, type "Set task 2 due tomorrow", verify due date is set

### Implementation for User Story 7

- [X] T051 [US7] Add set_due_date intent recognition in intent-analyzer.ts (patterns: "Set task [id] due [date]", "Task [id] due on [date]")
- [X] T052 [US7] Add get_task_dates intent recognition in intent-analyzer.ts (patterns: "When is task [id] due?")
- [X] T053 [US7] Add due_date entity extraction with natural language date parsing
- [X] T054 [US7] Add setDueDate function to tool-executor.ts
- [X] T055 [US7] Add getTaskDates function to tool-executor.ts
- [X] T056 [US7] Add friendly due date response templates to response-composer.ts

**Checkpoint**: User Story 7 complete - can manage due dates via conversation

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, accessibility, and deployment readiness

- [X] T057 [P] Add error handling for backend unavailable (FR-040) in tool-executor.ts
- [X] T058 [P] Add timeout handling (10s) with retry option (FR-041) in orchestrator.ts
- [X] T059 [P] Add rate limit handling with 30s cooldown (FR-043) in cohere-adapter.ts
- [X] T060 [P] Add intent unclear fallback with suggestions (FR-042) in response-composer.ts
- [X] T061 [P] Add session expiry handling (FR-035) in useChat.ts
- [X] T062 Handle ambiguous task references (multiple matches) in tool-executor.ts
- [X] T063 Add message length validation (max 1000 chars) in ChatInput.tsx
- [X] T064 [P] Verify all ARIA labels and screen reader support
- [X] T065 [P] Test mobile responsiveness on 320px-1920px viewports
- [X] T066 Verify Vercel build passes with no errors
- [ ] T067 Run production deployment and smoke test all 7 user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → ... → P7)
  - Each story builds on previous (T027 depends on US1 chatbot UI being ready)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Independent Test? |
|-------|------------|-------------------|
| US1 (P1) | Phase 2 only | Yes - UI only |
| US2 (P2) | Phase 2 + US1 UI | Yes - Add task |
| US3 (P3) | Phase 2 + US1 UI | Yes - List tasks |
| US4 (P4) | Phase 2 + US1 UI | Yes - Complete task |
| US5 (P5) | Phase 2 + US1 UI | Yes - Update task |
| US6 (P6) | Phase 2 + US1 UI | Yes - Delete task |
| US7 (P7) | Phase 2 + US1 UI | Yes - Due dates |

### Within Each User Story

- Components before integration
- Intent recognition before tool execution
- Tool execution before response composition
- Core implementation before edge cases

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (T006, T008, T009, T010)
- Within US2: T023, T024, T025 can run in parallel (different components)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all parallel foundational tasks together:
Task: "Create useChat hook at frontend/hooks/useChat.ts" (T006)
Task: "Implement intent-analyzer agent at frontend/lib/agents/intent-analyzer.ts" (T008)
Task: "Implement tool-executor agent at frontend/lib/agents/tool-executor.ts" (T009)
Task: "Implement response-composer agent at frontend/lib/agents/response-composer.ts" (T010)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Open/Close Chatbot)
4. **STOP and VALIDATE**: Test chatbot opens/closes on authenticated pages
5. Deploy to Vercel for early feedback

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (UI Only MVP!)
3. Add User Story 2 → Test add task → Deploy (Core AI Feature!)
4. Add User Story 3 → Test list tasks → Deploy
5. Add User Stories 4-7 → Complete CRUD → Deploy
6. Polish → Full feature ready

### Task Count by Phase

| Phase | Story | Task Count |
|-------|-------|------------|
| Phase 1 | Setup | 4 |
| Phase 2 | Foundational | 8 |
| Phase 3 | US1 - Open/Close | 10 |
| Phase 4 | US2 - Add Task | 10 |
| Phase 5 | US3 - List Tasks | 5 |
| Phase 6 | US4 - Complete Task | 5 |
| Phase 7 | US5 - Update Task | 4 |
| Phase 8 | US6 - Delete Task | 4 |
| Phase 9 | US7 - Due Dates | 6 |
| Phase 10 | Polish | 11 |
| **Total** | | **67** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Suggested MVP scope: Phase 1-4 (Setup + Foundational + US1 + US2) = 32 tasks
