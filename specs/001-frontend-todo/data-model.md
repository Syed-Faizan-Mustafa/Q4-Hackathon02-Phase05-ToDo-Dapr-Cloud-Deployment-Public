# Data Model: Frontend - Phase II Todo App

**Branch**: `001-frontend-todo` | **Date**: 2026-01-09

## Overview

This document defines the TypeScript types and interfaces used in the frontend application. These models correspond to backend API responses and local UI state.

---

## Core Entities

### User

Represents an authenticated user in the system.

```typescript
interface User {
  id: string;           // Unique identifier (UUID)
  email: string;        // User's email address
  name?: string;        // Optional display name
  createdAt: string;    // ISO 8601 timestamp
}
```

**Source**: Extracted from JWT token claims and Better Auth session.

---

### Task

Represents a task item owned by a user.

```typescript
interface Task {
  id: string;           // Unique identifier (UUID)
  userId: string;       // Owner's user ID (for API path construction)
  title: string;        // Task title (1-200 characters)
  description?: string; // Optional description (max 1000 characters)
  completed: boolean;   // Completion status
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}
```

**Validation Rules**:
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters
- `completed`: Boolean, defaults to `false`

---

### Session

Represents the authenticated user session.

```typescript
interface Session {
  user: User;           // Current user data
  token: string;        // JWT access token
  expiresAt: string;    // Token expiration timestamp
}
```

**Source**: Managed by Better Auth client.

---

## API Request/Response Types

### Authentication

```typescript
// Sign Up Request
interface SignUpRequest {
  email: string;
  password: string;     // 8+ chars, uppercase, lowercase, number
}

// Sign In Request
interface SignInRequest {
  email: string;
  password: string;
}

// Auth Response (both signup and signin)
interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// Auth Error Response
interface AuthError {
  code: string;         // e.g., "INVALID_CREDENTIALS", "EMAIL_EXISTS"
  message: string;      // Human-readable error message
}
```

---

### Tasks API

```typescript
// Create Task Request
interface CreateTaskRequest {
  title: string;        // 1-200 characters
  description?: string; // Max 1000 characters
}

// Update Task Request
interface UpdateTaskRequest {
  title?: string;       // 1-200 characters if provided
  description?: string; // Max 1000 characters if provided
  completed?: boolean;
}

// Task List Response
interface TaskListResponse {
  tasks: Task[];
  total: number;
}

// API Error Response
interface ApiError {
  code: string;         // e.g., "NOT_FOUND", "VALIDATION_ERROR"
  message: string;
  details?: Record<string, string[]>; // Field-level errors
}
```

---

## UI State Types

### Filter & Sort State

```typescript
type TaskFilter = "all" | "pending" | "completed";

type TaskSortField = "createdAt" | "title";

type SortDirection = "asc" | "desc";

interface TaskFilterState {
  filter: TaskFilter;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
}

// Default state
const defaultFilterState: TaskFilterState = {
  filter: "all",
  sortBy: "createdAt",
  sortDirection: "desc", // Newest first per clarification
};
```

---

### Modal State

```typescript
type ModalMode = "create" | "edit";

interface TaskModalState {
  isOpen: boolean;
  mode: ModalMode;
  task?: Task;          // Populated in edit mode
}
```

---

### Form State

```typescript
interface TaskFormData {
  title: string;
  description: string;
}

interface AuthFormData {
  email: string;
  password: string;
}

interface FormError {
  field: string;
  message: string;
}
```

---

### Loading & Error State

```typescript
type LoadingState = "idle" | "loading" | "success" | "error";

interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}
```

---

## Validation Schemas (Zod)

```typescript
import { z } from "zod";

// Password validation per clarification
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial();
```

---

## Type Exports

All types are exported from `/types/index.ts`:

```typescript
// types/index.ts
export type {
  User,
  Task,
  Session,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  AuthError,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskListResponse,
  ApiError,
  TaskFilter,
  TaskSortField,
  SortDirection,
  TaskFilterState,
  ModalMode,
  TaskModalState,
  TaskFormData,
  AuthFormData,
  FormError,
  LoadingState,
  AsyncState,
};
```

---

## Entity Relationships

```
┌─────────────┐
│    User     │
│─────────────│
│ id          │◄──────────────┐
│ email       │               │
│ name?       │               │
│ createdAt   │               │
└─────────────┘               │
                              │ userId
┌─────────────┐               │
│    Task     │               │
│─────────────│               │
│ id          │               │
│ userId      │───────────────┘
│ title       │
│ description?│
│ completed   │
│ createdAt   │
│ updatedAt   │
└─────────────┘
```

**Relationship**: One User has many Tasks (1:N). Frontend accesses tasks via user-scoped API endpoints.
