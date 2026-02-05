# API Client Contract: Frontend - Phase II Todo App

**Branch**: `001-frontend-todo` | **Date**: 2026-01-09

## Overview

This document defines the API client interface that the frontend uses to communicate with the FastAPI backend. All endpoints follow the REST conventions defined in the constitution.

---

## Base Configuration

```typescript
// Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000  // Backend API base URL
NEXT_PUBLIC_AUTH_URL=http://localhost:3000 // Better Auth base URL
```

---

## Authentication Endpoints

### Sign Up

Creates a new user account.

```
POST /auth/signup
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (201 Created):
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "createdAt": "2026-01-09T10:00:00Z"
  },
  "token": "jwt-token-string",
  "expiresAt": "2026-01-16T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format or password requirements not met
- `409 Conflict`: Email already registered

---

### Sign In

Authenticates an existing user.

```
POST /auth/signin
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "createdAt": "2026-01-09T10:00:00Z"
  },
  "token": "jwt-token-string",
  "expiresAt": "2026-01-16T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials

---

### Sign Out

Invalidates the current session.

```
POST /auth/signout
```

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):
```json
{
  "message": "Successfully signed out"
}
```

---

## Task Endpoints

All task endpoints require authentication and use the user-scoped path pattern.

**Headers** (all requests):
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

### List Tasks

Retrieves all tasks for the authenticated user.

```
GET /api/{user_id}/tasks
```

**Path Parameters**:
- `user_id`: UUID of the authenticated user

**Success Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": "task-uuid-1",
      "userId": "user-uuid",
      "title": "Complete project",
      "description": "Finish the frontend implementation",
      "completed": false,
      "createdAt": "2026-01-09T10:00:00Z",
      "updatedAt": "2026-01-09T10:00:00Z"
    },
    {
      "id": "task-uuid-2",
      "userId": "user-uuid",
      "title": "Review code",
      "description": null,
      "completed": true,
      "createdAt": "2026-01-08T15:30:00Z",
      "updatedAt": "2026-01-09T09:00:00Z"
    }
  ],
  "total": 2
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: user_id doesn't match token

---

### Get Task

Retrieves a specific task by ID.

```
GET /api/{user_id}/tasks/{task_id}
```

**Path Parameters**:
- `user_id`: UUID of the authenticated user
- `task_id`: UUID of the task

**Success Response** (200 OK):
```json
{
  "id": "task-uuid",
  "userId": "user-uuid",
  "title": "Complete project",
  "description": "Finish the frontend implementation",
  "completed": false,
  "createdAt": "2026-01-09T10:00:00Z",
  "updatedAt": "2026-01-09T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Task doesn't belong to user
- `404 Not Found`: Task doesn't exist

---

### Create Task

Creates a new task for the authenticated user.

```
POST /api/{user_id}/tasks
```

**Path Parameters**:
- `user_id`: UUID of the authenticated user

**Request Body**:
```json
{
  "title": "New task title",
  "description": "Optional description"
}
```

**Validation**:
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters

**Success Response** (201 Created):
```json
{
  "id": "new-task-uuid",
  "userId": "user-uuid",
  "title": "New task title",
  "description": "Optional description",
  "completed": false,
  "createdAt": "2026-01-09T12:00:00Z",
  "updatedAt": "2026-01-09T12:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (title too long, etc.)
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: user_id doesn't match token

---

### Update Task

Updates an existing task.

```
PUT /api/{user_id}/tasks/{task_id}
```

**Path Parameters**:
- `user_id`: UUID of the authenticated user
- `task_id`: UUID of the task

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true
}
```

**Validation**:
- `title`: Optional, 1-200 characters if provided
- `description`: Optional, max 1000 characters if provided
- `completed`: Optional boolean

**Success Response** (200 OK):
```json
{
  "id": "task-uuid",
  "userId": "user-uuid",
  "title": "Updated title",
  "description": "Updated description",
  "completed": true,
  "createdAt": "2026-01-09T10:00:00Z",
  "updatedAt": "2026-01-09T14:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Task doesn't belong to user
- `404 Not Found`: Task doesn't exist

---

### Delete Task

Deletes a task.

```
DELETE /api/{user_id}/tasks/{task_id}
```

**Path Parameters**:
- `user_id`: UUID of the authenticated user
- `task_id`: UUID of the task

**Success Response** (204 No Content):
*No body*

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Task doesn't belong to user
- `404 Not Found`: Task doesn't exist

---

### Toggle Task Completion

Toggles the completion status of a task.

```
PATCH /api/{user_id}/tasks/{task_id}/complete
```

**Path Parameters**:
- `user_id`: UUID of the authenticated user
- `task_id`: UUID of the task

**Success Response** (200 OK):
```json
{
  "id": "task-uuid",
  "userId": "user-uuid",
  "title": "Task title",
  "description": "Description",
  "completed": true,
  "createdAt": "2026-01-09T10:00:00Z",
  "updatedAt": "2026-01-09T15:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Task doesn't belong to user
- `404 Not Found`: Task doesn't exist

---

## API Client Interface

```typescript
// lib/api.ts

interface ApiClient {
  // Tasks
  getTasks(userId: string): Promise<TaskListResponse>;
  getTask(userId: string, taskId: string): Promise<Task>;
  createTask(userId: string, data: CreateTaskRequest): Promise<Task>;
  updateTask(userId: string, taskId: string, data: UpdateTaskRequest): Promise<Task>;
  deleteTask(userId: string, taskId: string): Promise<void>;
  toggleTaskComplete(userId: string, taskId: string): Promise<Task>;
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User doesn't have access to resource |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource already exists (e.g., email) |
| `INTERNAL_ERROR` | 500 | Server error |

### Retry Strategy (per clarification)

1. On network error or 5xx response
2. Wait 2 seconds
3. Retry once
4. If still failing, surface error to user with manual retry option
5. **Never retry**: 401, 403, 404, 400 errors (not transient)

---

## Rate Limiting

Backend implements rate limiting on authentication endpoints:
- `/auth/signin`: 5 requests per minute per IP
- `/auth/signup`: 3 requests per minute per IP

Frontend should handle `429 Too Many Requests` with appropriate message.
