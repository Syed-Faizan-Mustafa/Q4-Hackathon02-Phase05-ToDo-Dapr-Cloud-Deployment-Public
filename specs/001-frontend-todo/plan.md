# Implementation Plan: Frontend - Phase II Todo App

**Branch**: `001-frontend-todo` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-todo/spec.md`

## Summary

Build a professional, responsive frontend for the Phase II Todo Full-Stack Web Application using Next.js 16+ App Router with TypeScript and Tailwind CSS. The frontend integrates with Better Auth for JWT-based authentication and communicates with the FastAPI backend via REST API. Key features include user authentication (signup/signin), task CRUD operations, filtering/sorting, and a polished responsive UI.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 18+
**Primary Dependencies**: Next.js 16+ (App Router), React 18+, Tailwind CSS 3.x, Better Auth
**Storage**: N/A (frontend-only; backend handles persistence)
**Testing**: Jest + React Testing Library for unit/integration tests
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
**Project Type**: Web application (monorepo frontend component)
**Performance Goals**: <2s page load, <100ms UI response, 60fps animations
**Constraints**: 320px-1920px responsive, JWT in all API requests, session-based auth
**Scale/Scope**: Single-user view, up to 100 tasks per user displayed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Monorepo Architecture | ✅ PASS | Frontend in `/frontend` directory, independently buildable |
| II. JWT-Based Authentication | ✅ PASS | Better Auth issues JWT, attached to all API requests via Authorization header |
| III. User Data Isolation | ✅ PASS | API calls include user_id in path, backend enforces isolation |
| IV. RESTful API Design | ✅ PASS | Frontend calls REST endpoints per constitution patterns |
| V. Test-First Development | ✅ PASS | Jest + RTL for component and integration tests |
| VI. Environment-Based Configuration | ✅ PASS | BETTER_AUTH_SECRET and API_URL via environment variables |

**Gate Result**: PASS - All constitution principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-todo/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-client.md    # Frontend API client contract
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing/redirect page
│   ├── signin/
│   │   └── page.tsx         # Sign in page
│   ├── signup/
│   │   └── page.tsx         # Sign up page
│   └── tasks/
│       └── page.tsx         # Task dashboard (protected)
├── components/
│   ├── ui/                  # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── AuthForm.tsx         # Reusable auth form
│   ├── Header.tsx           # Navigation header
│   ├── TaskCard.tsx         # Individual task display
│   ├── TaskList.tsx         # Task list container
│   ├── TaskModal.tsx        # Create/Edit task modal
│   ├── FilterSortBar.tsx    # Filter and sort controls
│   └── EmptyState.tsx       # Empty task list state
├── lib/
│   ├── api.ts               # API client with JWT handling
│   ├── auth.ts              # Better Auth client setup
│   └── utils.ts             # Utility functions
├── hooks/
│   ├── useAuth.ts           # Authentication hook
│   └── useTasks.ts          # Tasks data hook
├── types/
│   └── index.ts             # TypeScript type definitions
├── styles/
│   └── globals.css          # Global styles + Tailwind
└── __tests__/
    ├── components/          # Component tests
    └── integration/         # Integration tests
```

**Structure Decision**: Web application structure with Next.js App Router. Frontend is self-contained within `/frontend` directory following monorepo architecture principle. Uses App Router conventions with `app/` directory for routes and `components/` for reusable UI.

## Architecture Decisions

### 1. Server vs Client Components

- **Server Components (default)**: Layout, static content, initial data fetching
- **Client Components**: Forms, modals, interactive elements (filter/sort), real-time updates
- **Rationale**: Maximize SSR benefits while enabling interactivity where needed

### 2. State Management

- **Local State**: React useState for component-level state (modal open, form values)
- **Server State**: React Query or SWR pattern for API data (tasks list)
- **Auth State**: Better Auth session context
- **Rationale**: Simple, focused state management without Redux complexity

### 3. API Communication Pattern

- **Centralized Client**: `/lib/api.ts` handles all backend communication
- **JWT Injection**: Automatically attach token from Better Auth session
- **Error Handling**: Consistent error handling with retry logic (1 retry after 2s)
- **Rationale**: Single source of truth for API calls, consistent auth handling

### 4. Styling Approach

- **Tailwind CSS**: Utility-first styling for rapid development
- **Design Tokens**: Consistent spacing, colors, typography via Tailwind config
- **Component Variants**: Button/Input variants for consistent UI
- **Rationale**: Professional appearance with maintainable, consistent styling

## Phase Breakdown

### Phase 1: Frontend Foundation Setup
- Next.js App Router verification
- Tailwind CSS configuration
- Global styles and design tokens
- Base layout component
- UI primitives (Button, Input, Card, Modal)

### Phase 2: Authentication UI & Flow
- Sign in page (`/signin`)
- Sign up page (`/signup`)
- AuthForm component with validation
- Better Auth integration
- Password validation (8+ chars, uppercase, lowercase, number)
- Error state handling
- Redirect logic

### Phase 3: Protected Routing & Layout
- Route protection middleware/wrapper
- Authenticated layout with Header
- User info display
- Logout functionality
- Session persistence

### Phase 4: API Client & JWT Handling
- `/lib/api.ts` implementation
- JWT token attachment
- API methods (getTasks, createTask, updateTask, deleteTask, toggleComplete)
- Error handling with retry (1 retry after 2s)
- Loading state management

### Phase 5: Task Dashboard UI
- Tasks page (`/tasks`)
- TaskList component
- TaskCard component
- Responsive grid/list layout
- Loading skeleton states
- Empty state

### Phase 6: Task CRUD Interactions
- TaskModal for create/edit
- Form validation (title 1-200, description max 1000)
- Delete confirmation dialog
- Toggle complete action
- Optimistic UI updates

### Phase 7: Filtering, Sorting & UX Polish
- FilterSortBar component
- Status filters (All, Pending, Completed)
- Sort options (Created date desc default, Title)
- Collapsible filter bar on mobile
- Animations and transitions
- Accessibility improvements

## Complexity Tracking

No constitution violations requiring justification. Architecture follows all principles.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Better Auth integration complexity | Medium | Follow official docs, test auth flow early |
| JWT token refresh handling | Medium | Implement token refresh interceptor in api.ts |
| Mobile responsive edge cases | Low | Test on multiple viewport sizes, use Tailwind breakpoints |
| API latency affecting UX | Low | Loading states, optimistic updates, retry logic |
