# Research: Frontend - Phase II Todo App

**Branch**: `001-frontend-todo` | **Date**: 2026-01-09

## Overview

This document captures research findings for the frontend implementation decisions. All technical unknowns have been resolved.

---

## 1. Better Auth Integration with Next.js App Router

### Decision
Use Better Auth's official Next.js integration with App Router support.

### Rationale
- Better Auth provides first-class Next.js support with App Router compatibility
- Built-in session management handles JWT token lifecycle
- Provides React hooks for auth state (`useSession`, `signIn`, `signOut`)
- Automatic cookie-based session storage (secure, httpOnly)

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| NextAuth.js | Project specifies Better Auth; switching adds unnecessary migration risk |
| Custom JWT handling | Reinventing auth is error-prone; Better Auth handles security edge cases |
| Firebase Auth | External dependency, different architecture than specified |

### Implementation Notes
```typescript
// lib/auth.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## 2. JWT Token Attachment Strategy

### Decision
Use axios interceptor pattern to automatically attach JWT to all API requests.

### Rationale
- Centralizes auth header logic in one place
- Automatically handles token attachment for every request
- Enables consistent error handling (401 → redirect to signin)
- Works with Better Auth's session token retrieval

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Manual header on each request | Error-prone, repetitive, easy to forget |
| Fetch wrapper | Less feature-rich than axios interceptors |
| Server-side only API calls | Limits client-side interactivity |

### Implementation Notes
```typescript
// lib/api.ts
import axios from "axios";
import { authClient } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const session = await authClient.getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});
```

---

## 3. State Management Approach

### Decision
Use React Query (TanStack Query) for server state, React useState for UI state.

### Rationale
- React Query provides caching, background refetching, optimistic updates
- Simplifies loading/error state management
- No need for Redux complexity for this scope
- Built-in retry logic aligns with spec (1 retry after 2s)

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Redux Toolkit | Overkill for task list scope; adds boilerplate |
| Zustand | Good option, but React Query better suited for API-centric state |
| SWR | Similar to React Query; RQ has more features for mutations |
| Context only | Lacks caching, refetching, optimistic update patterns |

### Implementation Notes
```typescript
// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTasks(userId: string) {
  return useQuery({
    queryKey: ["tasks", userId],
    queryFn: () => api.getTasks(userId),
    retry: 1,
    retryDelay: 2000,
  });
}
```

---

## 4. Form Validation Library

### Decision
Use React Hook Form with Zod for schema validation.

### Rationale
- React Hook Form is performant (minimal re-renders)
- Zod provides type-safe schema validation
- Easy integration with TypeScript
- Supports complex validation rules (password: 8+ chars, uppercase, lowercase, number)

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Formik | More re-renders, heavier bundle size |
| Native form validation | Limited complex rule support, inconsistent UX |
| Yup | Similar to Zod; Zod has better TypeScript inference |

### Implementation Notes
```typescript
// Validation schemas
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
});
```

---

## 5. UI Component Strategy

### Decision
Build custom components with Tailwind CSS; no external component library.

### Rationale
- Full control over styling and behavior
- Smaller bundle size (no unused components)
- Tailwind enables rapid, consistent styling
- Spec requires specific UX patterns (modals, cards)

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| shadcn/ui | Good option, but adds abstraction layer; custom is simpler for scope |
| Radix UI | Headless is good, but custom components are straightforward enough |
| Material UI | Heavy, opinionated styling doesn't match "clean professional" requirement |
| Chakra UI | Good DX, but Tailwind is already specified in stack |

### Implementation Notes
- Design tokens defined in `tailwind.config.js`
- Reusable primitives: Button, Input, Card, Modal in `/components/ui/`
- Consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Color palette: neutral grays, primary blue accent, success green, error red

---

## 6. Responsive Design Strategy

### Decision
Mobile-first approach with Tailwind breakpoints.

### Rationale
- Mobile-first ensures core functionality works on all devices
- Tailwind breakpoints (sm, md, lg, xl) map to common viewport sizes
- Single-column mobile, multi-column desktop per spec requirement

### Breakpoint Mapping
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Default | < 640px | Single column, collapsible filter bar |
| sm | ≥ 640px | Single column, expanded filter bar |
| md | ≥ 768px | Two-column task grid |
| lg | ≥ 1024px | Three-column task grid, sidebar filter |
| xl | ≥ 1280px | Four-column task grid |

---

## 7. Animation & Transition Approach

### Decision
Use Tailwind transitions + Framer Motion for modal animations.

### Rationale
- Tailwind handles simple transitions (hover, focus states)
- Framer Motion provides smooth modal enter/exit animations
- Minimal JS runtime for most animations
- 60fps target achievable with CSS-based transitions

### Implementation Notes
```typescript
// Modal animation with Framer Motion
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 8. Error Handling & Retry Logic

### Decision
Implement centralized error handling with automatic retry per clarification.

### Rationale
- Spec clarification: 1 automatic retry after 2 seconds, then manual retry option
- Centralized handling ensures consistent UX across all API calls
- React Query's retry configuration aligns with this requirement

### Error Flow
1. API call fails
2. Wait 2 seconds
3. Automatic retry
4. If still failing, show error toast with manual retry button
5. 401 errors → redirect to signin (no retry)
6. 403 errors → show access denied message

---

## Summary

All technical decisions have been resolved. No remaining NEEDS CLARIFICATION items. The frontend will use:

- **Auth**: Better Auth with Next.js integration
- **State**: React Query for server state, useState for UI
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS with custom components
- **Animations**: Tailwind transitions + Framer Motion
- **API**: Axios with interceptors for JWT
