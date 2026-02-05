# Data Model: Backend Todo API Service

**Feature**: 002-backend-todo-api
**Date**: 2026-01-10
**Phase**: 1 (Design)

## Overview

This document defines the database schema and ORM models for the Backend Todo API Service using SQLModel with PostgreSQL.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           TASKS                                  │
├─────────────────────────────────────────────────────────────────┤
│ id          : UUID (PK)                                         │
│ user_id     : VARCHAR(255) (NOT NULL, INDEXED)                  │
│ title       : VARCHAR(255) (NOT NULL)                           │
│ description : TEXT (NULLABLE)                                   │
│ completed   : BOOLEAN (NOT NULL, DEFAULT FALSE)                 │
│ created_at  : TIMESTAMP WITH TIME ZONE (NOT NULL, DEFAULT NOW)  │
│ updated_at  : TIMESTAMP WITH TIME ZONE (NOT NULL, DEFAULT NOW)  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tasks Table

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);

-- Constraint: title must not be empty
ALTER TABLE tasks ADD CONSTRAINT chk_title_not_empty CHECK (length(trim(title)) > 0);

-- Constraint: description max length (enforced at app level, but safety net)
ALTER TABLE tasks ADD CONSTRAINT chk_description_max_length CHECK (length(description) <= 2000);
```

## SQLModel Definitions

### Base Model

```python
# backend/src/models/base.py
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, func

class TimestampMixin(SQLModel):
    """Mixin for created_at and updated_at timestamps."""
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False
        )
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False
        )
    )
```

### Task Model

```python
# backend/src/models/task.py
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from typing import Optional

class TaskBase(SQLModel):
    """Base task model with shared fields."""
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: bool = Field(default=False)

class Task(TaskBase, table=True):
    """Database model for tasks."""
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(max_length=255, index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class TaskCreate(TaskBase):
    """Schema for creating a new task (request body)."""
    pass

class TaskUpdate(SQLModel):
    """Schema for updating a task (request body). All fields optional."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: Optional[bool] = None

class TaskRead(TaskBase):
    """Schema for reading a task (response body)."""
    id: UUID
    user_id: str
    created_at: datetime
    updated_at: datetime
```

## Field Specifications

### Task Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | UUID | Primary Key | Auto-generated | Unique task identifier |
| `user_id` | VARCHAR(255) | NOT NULL, Indexed | N/A | Owner's ID from JWT `sub` claim |
| `title` | VARCHAR(255) | NOT NULL, 1-255 chars | N/A | Task title (required) |
| `description` | TEXT | Max 2000 chars | NULL | Optional task description |
| `completed` | BOOLEAN | NOT NULL | FALSE | Task completion status |
| `created_at` | TIMESTAMP WITH TZ | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TZ | NOT NULL | CURRENT_TIMESTAMP | Last modification timestamp |

### User ID Format

The `user_id` field stores the user identifier from the JWT `sub` (subject) claim. Based on Better Auth:
- Format: UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Max length: 255 characters (accommodates various ID formats)
- Source: Extracted from verified JWT token

## Validation Rules

### Title Validation
- Required field
- Minimum length: 1 character (after trimming)
- Maximum length: 255 characters
- Whitespace-only strings are invalid

### Description Validation
- Optional field (nullable)
- Maximum length: 2000 characters
- Empty string is allowed

### Completed Validation
- Boolean type
- Defaults to `false` when not provided

## Query Patterns

### List Tasks for User
```sql
SELECT * FROM tasks
WHERE user_id = :user_id
ORDER BY created_at DESC;
```

### Get Single Task (with ownership check)
```sql
SELECT * FROM tasks
WHERE id = :task_id AND user_id = :user_id;
```

### Create Task
```sql
INSERT INTO tasks (id, user_id, title, description, completed, created_at, updated_at)
VALUES (:id, :user_id, :title, :description, :completed, :created_at, :updated_at)
RETURNING *;
```

### Update Task
```sql
UPDATE tasks
SET title = COALESCE(:title, title),
    description = COALESCE(:description, description),
    completed = COALESCE(:completed, completed),
    updated_at = CURRENT_TIMESTAMP
WHERE id = :task_id AND user_id = :user_id
RETURNING *;
```

### Delete Task
```sql
DELETE FROM tasks
WHERE id = :task_id AND user_id = :user_id
RETURNING id;
```

## Database Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `tasks_pkey` | `id` | Primary key lookup (automatic) |
| `idx_tasks_user_id` | `user_id` | User isolation queries |
| `idx_tasks_user_created` | `user_id, created_at DESC` | Sorted task listing |

## Migrations

### Initial Migration (001_create_tasks_table.sql)

```sql
-- Migration: 001_create_tasks_table
-- Created: 2026-01-10
-- Description: Create initial tasks table

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_description_max_length CHECK (description IS NULL OR length(description) <= 2000)
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);

COMMIT;
```

### Rollback Migration

```sql
-- Rollback: 001_create_tasks_table
BEGIN;
DROP TABLE IF EXISTS tasks;
COMMIT;
```

## Data Integrity Constraints

1. **Primary Key**: Every task has a unique UUID identifier
2. **User Isolation**: All queries filter by user_id (enforced at application layer)
3. **Title Required**: Database constraint ensures title is not empty
4. **Description Length**: Database constraint limits description to 2000 characters
5. **Timestamps**: Automatic creation and update timestamps
6. **No Orphans**: Tasks are permanently deleted (no soft delete per spec assumption)

## Performance Considerations

- **UUID as Primary Key**: Slightly slower than sequential IDs but provides global uniqueness and security (no enumeration)
- **User ID Index**: Critical for user isolation queries; all task queries filter by user_id
- **Composite Index**: Optimizes the common "list my tasks sorted by date" query pattern
- **No Pagination**: Initial version returns all tasks; index supports up to ~1000 tasks per user efficiently
