-- Migration: 001_create_tasks_table
-- Created: 2026-01-10
-- Description: Create initial tasks table for Todo API

BEGIN;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_description_max_length CHECK (description IS NULL OR length(description) <= 2000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE tasks IS 'User tasks for the Todo application';
COMMENT ON COLUMN tasks.user_id IS 'User ID from JWT sub claim';
COMMENT ON COLUMN tasks.title IS 'Task title (1-255 characters)';
COMMENT ON COLUMN tasks.description IS 'Optional task description (max 2000 characters)';
COMMENT ON COLUMN tasks.completed IS 'Task completion status';

COMMIT;
