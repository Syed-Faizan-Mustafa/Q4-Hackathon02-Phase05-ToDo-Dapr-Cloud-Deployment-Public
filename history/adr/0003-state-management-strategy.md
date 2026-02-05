# ADR-0003: State Management Strategy

- **Status:** Accepted
- **Date:** 2026-01-09
- **Feature:** 001-frontend-todo
- **Context:** The frontend needs to manage multiple state categories: server data (tasks from API), authentication state (user session), and UI state (modal visibility, form values, filter/sort selections). The solution must support caching, background refetching, optimistic updates for good UX, and the specified retry behavior (1 retry after 2 seconds).

## Decision

We will use a layered state management approach with purpose-specific tools:

- **Server State**: React Query (TanStack Query) for all API data
  - Tasks list with caching and background refetch
  - Built-in retry: 1 retry after 2000ms delay (per spec clarification)
  - Optimistic updates for create/update/delete operations
  - Query invalidation for cache consistency

- **Auth State**: Better Auth session context
  - User information from JWT claims
  - Session status (authenticated/unauthenticated)
  - Managed by auth library, not duplicated

- **UI State**: React useState for component-local state
  - Modal open/close state
  - Form input values
  - Filter and sort selections
  - Loading indicators

This layered approach keeps each state category in its appropriate home without global store complexity.

## Consequences

### Positive

- **Automatic Caching**: React Query caches API responses, reducing redundant requests
- **Background Refetch**: Data stays fresh without manual polling implementation
- **Optimistic Updates**: UI responds immediately to user actions before API confirms
- **Built-in Retry**: React Query's retry configuration matches spec requirement exactly
- **Loading/Error States**: Built-in status handling simplifies component logic
- **Minimal Boilerplate**: No reducers, actions, or store configuration needed
- **Type Safety**: TanStack Query has excellent TypeScript support
- **Dev Tools**: React Query DevTools provide visibility into cache state

### Negative

- **Learning Curve**: React Query patterns (query keys, invalidation) require learning
- **Query Key Management**: Incorrect keys can cause cache misses or stale data
- **No Cross-Component UI State**: Complex UI state sharing would need Context (acceptable for current scope)
- **Bundle Size**: React Query adds ~12KB to bundle (justified by feature set)
- **Server Component Limitations**: React Query is client-side; server components need different data fetching

## Alternatives Considered

**Alternative A: Redux Toolkit + RTK Query**
- Pros: Comprehensive solution, time-travel debugging, predictable state updates
- Rejected: Overkill for task list scope; adds significant boilerplate (slices, reducers, selectors); RTK Query duplicates React Query capabilities

**Alternative B: Zustand + SWR**
- Pros: Lightweight, minimal API surface, good TypeScript support
- Rejected: SWR has fewer mutation features than React Query; Zustand adds another library when useState suffices for UI state

**Alternative C: React Context Only**
- Pros: No additional dependencies, built into React
- Rejected: Lacks caching, background refetch, optimistic updates, retry logic; would require reimplementing these features

**Alternative D: Jotai/Recoil (Atomic State)**
- Pros: Fine-grained reactivity, atom-based model
- Rejected: Adds complexity without clear benefit for this scope; React Query better suited for API-centric state

## References

- Feature Spec: specs/001-frontend-todo/spec.md (FR-015, FR-025, FR-027)
- Implementation Plan: specs/001-frontend-todo/plan.md (Architecture Decisions section 2)
- Research Document: specs/001-frontend-todo/research.md (Section 3: State Management Approach)
- Clarifications: specs/001-frontend-todo/spec.md (Session 2026-01-09: retry behavior)
- Related ADRs: ADR-0001 (Frontend Technology Stack), ADR-0002 (Authentication Architecture)
