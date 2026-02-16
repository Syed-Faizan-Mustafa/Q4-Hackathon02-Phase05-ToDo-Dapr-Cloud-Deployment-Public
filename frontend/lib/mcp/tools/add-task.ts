/**
 * MCP Tool: add_task
 * Feature: Phase 5 Part A
 *
 * Creates a new task via backend API with priority, tags, due date, and recurrence.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const addTaskTool: MCPTool = {
  name: 'add_task',
  description: 'Add a new task to the user\'s todo list with optional priority, tags, due date, and recurrence',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Task title (required, 1-200 characters)',
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        description: 'Task description (optional)',
        maxLength: 1000,
      },
      priority: {
        type: 'string',
        description: 'Task priority level',
        enum: ['high', 'medium', 'low'],
        default: 'medium',
      },
      tags: {
        type: 'array',
        description: 'Task tags (max 10)',
        items: { type: 'string' },
      },
      due_date: {
        type: 'string',
        description: 'Due date in ISO 8601 format (YYYY-MM-DD)',
        format: 'date',
      },
      is_recurring: {
        type: 'boolean',
        description: 'Whether this is a recurring task',
      },
      recurrence_pattern: {
        type: 'string',
        description: 'Recurrence pattern',
        enum: ['daily', 'weekly', 'monthly'],
      },
      recurrence_interval: {
        type: 'integer',
        description: 'Recurrence interval (e.g., every N days/weeks/months)',
        minimum: 1,
      },
    },
    required: ['title'],
  },
};

export async function addTaskHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const title = input.title as string | undefined;
  const description = input.description as string | undefined;
  const priority = input.priority as string | undefined;
  const tags = input.tags as string[] | undefined;
  const due_date = input.due_date as string | undefined;
  const is_recurring = input.is_recurring as boolean | undefined;
  const recurrence_pattern = input.recurrence_pattern as string | undefined;
  const recurrence_interval = input.recurrence_interval as number | undefined;

  if (!title || title.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Task title is required',
      },
    };
  }

  // Build request body with native fields
  const body: Record<string, unknown> = {
    title: title.trim(),
  };

  if (description?.trim()) body.description = description.trim();
  if (priority) body.priority = priority;
  if (tags && tags.length > 0) body.tags = tags;
  if (due_date) body.due_date = due_date;
  if (is_recurring !== undefined) body.is_recurring = is_recurring;
  if (recurrence_pattern) body.recurrence_pattern = recurrence_pattern;
  if (recurrence_interval !== undefined) body.recurrence_interval = recurrence_interval;

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.jwtToken}`,
      },
      body: JSON.stringify(body),
    });

    console.log('[MCP add_task] Backend response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: { code: 'AUTH_EXPIRED', message: 'Session expired. Please sign in again.' },
        };
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('[MCP add_task] Backend error:', errorData);
      return {
        success: false,
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to create task' },
      };
    }

    const task: Task = await response.json();
    console.log('[MCP add_task] Task created:', task.id);

    let message = `Created task "${task.title}"`;
    if (task.priority !== 'medium') message += ` (${task.priority} priority)`;
    if (task.due_date) message += ` (Due: ${formatDueDateForDisplay(task.due_date)})`;
    if (task.tags && task.tags.length > 0) message += ` [${task.tags.join(', ')}]`;

    return {
      success: true,
      content: { task, message },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}

function formatDueDateForDisplay(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const date = new Date(dateStr.split('T')[0] + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}
