# Tasks: Frontend - Phase II Todo App

**Input**: Design documents from `/specs/001-frontend-todo/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/api-client.md, research.md, quickstart.md

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` at repository root
- App Router: `frontend/app/` for pages
- Components: `frontend/components/`
- Library: `frontend/lib/`
- Hooks: `frontend/hooks/`
- Types: `frontend/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base structure

- [x] T001 Initialize Next.js 16+ project with TypeScript in frontend/
- [x] T002 [P] Configure Tailwind CSS with design tokens in frontend/tailwind.config.js
- [x] T003 [P] Create global styles with Tailwind directives in frontend/styles/globals.css
- [x] T004 [P] Create .env.example with NEXT_PUBLIC_API_URL and BETTER_AUTH_SECRET in frontend/.env.example
- [x] T005 [P] Install dependencies: @tanstack/react-query, axios, zod, react-hook-form, @hookform/resolvers, framer-motion, better-auth
- [x] T006 Create TypeScript types and interfaces in frontend/types/index.ts
- [x] T007 Create Zod validation schemas in frontend/lib/validations.ts

**Checkpoint**: Project structure ready with types and configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create root layout with providers (React Query, Auth) in frontend/app/layout.tsx
- [x] T009 [P] Create Button component with variants in frontend/components/ui/Button.tsx
- [x] T010 [P] Create Input component with error states in frontend/components/ui/Input.tsx
- [x] T011 [P] Create Card component in frontend/components/ui/Card.tsx
- [x] T012 [P] Create Modal component with Framer Motion animations in frontend/components/ui/Modal.tsx
- [x] T013 Create Better Auth client setup in frontend/lib/auth.ts
- [x] T014 Create API client with axios interceptors and JWT handling in frontend/lib/api.ts
- [x] T015 Implement retry logic (1 retry after 2s) in API client in frontend/lib/api.ts
- [x] T016 Create useAuth hook for session management in frontend/hooks/useAuth.ts
- [x] T017 Create utility functions (formatDate, truncateText) in frontend/lib/utils.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - User Authentication (Priority: P1)

**Goal**: Enable users to sign up or sign in to access their personal task list

**Independent Test**: Attempt signup/signin flows, verify JWT token issuance and session establishment, verify redirect to /tasks

### Implementation for User Story 1

- [x] T018 [P] [US1] Create AuthForm component with email/password fields in frontend/components/AuthForm.tsx
- [x] T019 [P] [US1] Implement password validation (8+ chars, uppercase, lowercase, number) in AuthForm
- [x] T020 [US1] Create signup page with AuthForm in frontend/app/signup/page.tsx
- [x] T021 [US1] Create signin page with AuthForm in frontend/app/signin/page.tsx
- [x] T022 [US1] Integrate Better Auth signUp function in signup page
- [x] T023 [US1] Integrate Better Auth signIn function in signin page
- [x] T024 [US1] Implement inline validation error display in AuthForm
- [x] T025 [US1] Implement redirect to /tasks after successful authentication
- [x] T026 [US1] Create Header component with user info and logout button in frontend/components/Header.tsx
- [x] T027 [US1] Implement logout functionality that clears session and redirects to /signin
- [x] T028 [US1] Create landing page that redirects to /signin or /tasks based on auth state in frontend/app/page.tsx

**Checkpoint**: User Story 1 complete - users can sign up, sign in, and log out

---

## Phase 4: User Story 2 - View and Filter Tasks (Priority: P2)

**Goal**: Display user's tasks in a professional layout with filtering and sorting capabilities

**Independent Test**: Log in, verify task list displays with correct layout, test filter/sort options, verify responsive behavior

### Implementation for User Story 2

- [x] T029 [US2] Create route protection wrapper/middleware for authenticated routes in frontend/lib/auth.ts
- [x] T030 [US2] Create tasks page layout with Header in frontend/app/tasks/page.tsx
- [x] T031 [US2] Protect /tasks route, redirect unauthenticated users to /signin
- [x] T032 [P] [US2] Create useTasks hook with React Query for data fetching in frontend/hooks/useTasks.ts
- [x] T033 [P] [US2] Create TaskCard component displaying title, description, status, date in frontend/components/TaskCard.tsx
- [x] T034 [US2] Create TaskList component with responsive grid layout in frontend/components/TaskList.tsx
- [x] T035 [US2] Implement description truncation with visual indicator in TaskCard
- [x] T036 [P] [US2] Create FilterSortBar component in frontend/components/FilterSortBar.tsx
- [x] T037 [US2] Implement filter by status (All, Pending, Completed) in FilterSortBar
- [x] T038 [US2] Implement sort options (Created date desc default, Title) in FilterSortBar
- [x] T039 [US2] Implement collapsible filter bar on mobile viewports
- [x] T040 [P] [US2] Create loading skeleton state for task list in TaskList
- [x] T041 [P] [US2] Create EmptyState component for when user has no tasks in frontend/components/EmptyState.tsx

**Checkpoint**: User Story 2 complete - users can view, filter, and sort their tasks

---

## Phase 5: User Story 3 - Create New Task (Priority: P3)

**Goal**: Enable users to create new tasks via modal dialog

**Independent Test**: Click Add Task button, fill form with valid/invalid data, verify task creation and list update

### Implementation for User Story 3

- [x] T042 [US3] Create TaskModal component for create/edit in frontend/components/TaskModal.tsx
- [x] T043 [US3] Implement create mode UI with title and description fields in TaskModal
- [x] T044 [US3] Implement task form validation (title 1-200 chars, description max 1000 chars)
- [x] T045 [US3] Add "Add Task" button to tasks page that opens TaskModal in create mode
- [x] T046 [US3] Implement createTask API call in TaskModal
- [x] T047 [US3] Implement success feedback and modal close on task creation
- [x] T048 [US3] Implement smooth modal open/close animations with Framer Motion
- [x] T049 [US3] Update task list after successful task creation (React Query invalidation)

**Checkpoint**: User Story 3 complete - users can create new tasks

---

## Phase 6: User Story 4 - Update Existing Task (Priority: P4)

**Goal**: Enable users to edit existing tasks via modal dialog

**Independent Test**: Click edit on a task, verify pre-populated form, modify and save, verify list updates

### Implementation for User Story 4

- [x] T050 [US4] Implement edit mode UI in TaskModal with pre-populated fields
- [x] T051 [US4] Add edit button to TaskCard that opens TaskModal in edit mode
- [x] T052 [US4] Implement updateTask API call in TaskModal edit mode
- [x] T053 [US4] Implement error handling - preserve original data on API failure
- [x] T054 [US4] Update task list after successful task update (React Query invalidation)

**Checkpoint**: User Story 4 complete - users can edit existing tasks

---

## Phase 7: User Story 5 - Complete and Delete Tasks (Priority: P5)

**Goal**: Enable users to toggle task completion and delete tasks

**Independent Test**: Toggle task completion, verify visual status change; delete task with confirmation, verify removal

### Implementation for User Story 5

- [x] T055 [US5] Add complete toggle button to TaskCard
- [x] T056 [US5] Implement toggleTaskComplete API call with optimistic update
- [x] T057 [US5] Add visual feedback for completed vs pending tasks in TaskCard
- [x] T058 [US5] Add delete button to TaskCard
- [x] T059 [US5] Create DeleteConfirmDialog component in frontend/components/DeleteConfirmDialog.tsx
- [x] T060 [US5] Implement deleteTask API call on confirmation
- [x] T061 [US5] Update task list after successful deletion (React Query invalidation)

**Checkpoint**: User Story 5 complete - users can complete and delete tasks

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T062 [P] Add hover and focus states to all interactive elements
- [x] T063 [P] Implement consistent loading states across all API operations
- [x] T064 [P] Add error toast/notification for API errors with manual retry option
- [x] T065 [P] Implement 401 handler - redirect to signin with session cleared
- [x] T066 [P] Implement 403 handler - show access denied message
- [x] T067 Add semantic HTML and ARIA labels for accessibility
- [x] T068 Test responsive layouts from 320px to 1920px width
- [x] T069 Verify all animations run at 60fps
- [x] T070 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Auth) must complete before US2 (protected routes)
  - US2 (View Tasks) should complete before US3-5 (task operations)
  - US3-5 can proceed in parallel once US2 is done
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1: Authentication) ←── BLOCKS ──→ Phase 4 (US2: View Tasks)
                                                    ↓
                              ┌──────────────┬──────┴──────┐
                              ↓              ↓              ↓
                        Phase 5         Phase 6         Phase 7
                        (US3: Create)   (US4: Update)   (US5: Complete/Delete)
                              └──────────────┴──────┬──────┘
                                                    ↓
                                              Phase 8 (Polish)
```

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004, T005 can run in parallel

**Phase 2 (Foundational)**:
- T009, T010, T011, T012 (UI components) can run in parallel

**Phase 4 (US2)**:
- T032, T033 can run in parallel
- T036, T040, T041 can run in parallel

**Phase 8 (Polish)**:
- T062, T063, T064, T065, T066 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch UI primitives in parallel:
Task: "Create Button component in frontend/components/ui/Button.tsx"
Task: "Create Input component in frontend/components/ui/Input.tsx"
Task: "Create Card component in frontend/components/ui/Card.tsx"
Task: "Create Modal component in frontend/components/ui/Modal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (View Tasks)
5. **STOP and VALIDATE**: Test authentication and task viewing independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Auth) → Test independently → Basic access
3. Add User Story 2 (View) → Test independently → Can see tasks
4. Add User Story 3 (Create) → Test independently → Can add tasks
5. Add User Story 4 (Update) → Test independently → Can edit tasks
6. Add User Story 5 (Complete/Delete) → Test independently → Full CRUD
7. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are relative to repository root
- Total tasks: 70
