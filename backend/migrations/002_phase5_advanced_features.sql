-- Migration: 002_phase5_advanced_features
-- Created: 2026-02-12
-- Description: Add Phase 5 Part A advanced features to tasks table
--   - priority (high/medium/low)
--   - tags (PostgreSQL text array)
--   - due_date, remind_at, reminder_sent
--   - recurring task fields (is_recurring, recurrence_pattern, recurrence_interval)
--   - parent_task_id for recurring chain

BEGIN;

-- 1. Add new columns with sensible defaults (backward compatible)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remind_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(10) NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL;

-- 2. Check constraints
ALTER TABLE tasks ADD CONSTRAINT chk_priority
    CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE tasks ADD CONSTRAINT chk_recurrence_pattern
    CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly'));

ALTER TABLE tasks ADD CONSTRAINT chk_recurrence_interval
    CHECK (recurrence_interval >= 1);

ALTER TABLE tasks ADD CONSTRAINT chk_tags_length
    CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(user_id, is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

COMMIT;
