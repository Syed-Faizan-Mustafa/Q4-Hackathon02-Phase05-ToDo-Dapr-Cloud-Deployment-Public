---
id: 001
title: Frontend Todo Spec Creation
stage: spec
date: 2026-01-09
surface: agent
model: claude-opus-4-5-20251101
feature: 001-frontend-todo
branch: 001-frontend-todo
user: user
command: /sp.specify
labels: ["spec", "frontend", "todo-app", "phase-2", "nextjs", "better-auth"]
links:
  spec: specs/001-frontend-todo/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-frontend-todo/spec.md
  - specs/001-frontend-todo/checklists/requirements.md
tests:
  - null
---

## Prompt

# sp.specify: Frontend - Phase II Todo App

## Purpose
Specify the **frontend implementation** for Phase II of the Todo Full-Stack Web Application.
The UI should be **professional, modern, and responsive**, suitable for desktop and mobile.

---

## Stack
- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS
- React Server Components where possible
- Client Components for interactivity
- Better Auth for JWT authentication
- API calls via `/lib/api.ts`

---

## Pages & Layouts

### 1. Authentication Pages
- `/signup` → User signup page
- `/signin` → User login page
- Features:
  - Email and password input
  - Validation errors displayed inline
  - Submit triggers Better Auth JWT login
  - Redirect to `/tasks` after successful login

### 2. Tasks Pages
- `/tasks` → Task dashboard (list + create + update + delete)
- Features:
  - List all tasks for logged-in user
  - Professional table or card layout for tasks
  - Show task title, description (truncated if long), status, creation date
  - Filter by status: All, Pending, Completed
  - Sort by: Created date, Title
  - Button to mark task as complete
  - Delete button with confirmation
  - Responsive design for mobile and desktop

### 3. Create/Edit Task Modal
- Use modal dialog for task creation and update
- Form fields: Title (required), Description (optional)
- Validation: Title 1-200 chars, Description max 1000 chars
- Buttons: Save / Cancel
- Smooth UX animations for opening/closing

---

## Components

- `/components/Header.tsx` → Navigation with user info and logout
- `/components/TaskCard.tsx` → Task item UI for dashboard
- `/components/TaskList.tsx` → Container to render list of tasks
- `/components/FilterSortBar.tsx` → Filters and sorting options
- `/components/Modal.tsx` → Generic modal for create/edit tasks
- `/components/AuthForm.tsx` → Reusable form for signup/signin

**UI Guidelines:**
- Tailwind CSS classes for layout and styling
- Clean professional color palette (e.g., neutral background, accent buttons)
- Mobile-first design
- Consistent spacing, typography, and buttons
- Hover and focus states for interactive elements

---

## API Integration
- Use `/lib/api.ts` to make requests to backend
- Include JWT token from Better Auth in every request header
- Handle loading states, success, and error feedback
- Update UI in real-time after operations

---

## Authentication Handling
- Protect `/tasks` route: redirect to `/signin` if not logged in
- Store JWT in session (Better Auth handles session)
- Extract user info from token for display
- Logout button clears session and redirects to `/signin`

---

## Responsive & Professional UI
- Desktop: Multi-column layout for tasks and filters
- Mobile: Single-column layout with collapsible filter/sort bar
- Buttons, modals, and inputs should have consistent style
- Smooth transitions/animations for UX
- Accessibility: Use semantic HTML, proper labels, and focus management

---

## Expected Output
- Fully functional, **professional frontend** for Phase II Todo App
- Pages: `/signin`, `/signup`, `/tasks`
- Reusable components for tasks, filters, modals, and auth
- Responsive, modern UI with Tailwind CSS
- Full integration with backend REST API and JWT auth

## Response snapshot

Created comprehensive frontend specification for Phase II Todo App:

**Branch**: `001-frontend-todo`
**Spec File**: `specs/001-frontend-todo/spec.md`

**5 User Stories (P1-P5)**:
1. User Authentication - signup/signin with Better Auth JWT
2. View and Filter Tasks - task list with filtering and sorting
3. Create New Task - modal-based task creation
4. Update Existing Task - edit task via modal
5. Complete and Delete Tasks - lifecycle management

**34 Functional Requirements** covering:
- Authentication (FR-001 to FR-010)
- Task Display (FR-011 to FR-017)
- Task CRUD Operations (FR-018 to FR-025)
- UI/UX (FR-026 to FR-032)
- Navigation (FR-033 to FR-034)

**10 Success Criteria** - all measurable and technology-agnostic

**Quality Checklist**: All items passed - spec ready for planning

## Outcome

- ✅ Impact: Complete frontend specification ready for implementation planning
- 🧪 Tests: N/A - specification document
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.clarify (optional) or /sp.plan to create implementation plan
- 🧠 Reflection: User provided comprehensive requirements, no clarifications needed. Spec captures all frontend needs while remaining technology-agnostic in requirements.

## Evaluation notes (flywheel)

- Failure modes observed: None - comprehensive user input
- Graders run and results (PASS/FAIL): Quality checklist PASS (all items)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
