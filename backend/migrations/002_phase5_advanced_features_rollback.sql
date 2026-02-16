-- Rollback: 002_phase5_advanced_features
-- Description: Remove Phase 5 Part A columns from tasks table

BEGIN;

-- Drop indexes first
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_tags;
DROP INDEX IF EXISTS idx_tasks_recurring;
DROP INDEX IF EXISTS idx_tasks_parent;

-- Drop constraints
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_priority;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_recurrence_pattern;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_recurrence_interval;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_tags_length;

-- Drop columns
ALTER TABLE tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE tasks DROP COLUMN IF EXISTS tags;
ALTER TABLE tasks DROP COLUMN IF EXISTS due_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS remind_at;
ALTER TABLE tasks DROP COLUMN IF EXISTS reminder_sent;
ALTER TABLE tasks DROP COLUMN IF EXISTS is_recurring;
ALTER TABLE tasks DROP COLUMN IF EXISTS recurrence_pattern;
ALTER TABLE tasks DROP COLUMN IF EXISTS recurrence_interval;
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_task_id;

COMMIT;
