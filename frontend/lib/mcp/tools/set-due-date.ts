/**
 * MCP Tool: set_due_date
 * Feature: Phase 5 Part A
 *
 * Sets or updates the due date for a task using native due_date field.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const setDueDateTool: MCPTool = {
  name: 'set_due_date',
  description: 'Set or update the due date for a task',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task (required)',
        minLength: 1,
      },
      due_date: {
        type: 'string',
        description: 'Due date in ISO 8601 format (YYYY-MM-DD) (required)',
        format: 'date',
      },
    },
    required: ['task_id', 'due_date'],
  },
};

export async function setDueDateHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const task_id = input.task_id as string | undefined;
  const due_date = input.due_date as string | undefined;

  if (!task_id || task_id.trim().length === 0) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Valid task ID is required' },
    };
  }

  if (!due_date) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Due date is required' },
    };
  }

  // Parse and normalize the due date
  const normalizedDate = parseDueDate(due_date);

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Use native due_date field via PATCH
    const response = await fetch(`${backendUrl}/api/v1/tasks/${task_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.jwtToken}`,
      },
      body: JSON.stringify({ due_date: normalizedDate }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: { code: 'AUTH_EXPIRED', message: 'Session expired. Please sign in again.' },
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          error: { code: 'TASK_NOT_FOUND', message: `Task ${task_id} not found` },
        };
      }
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to set due date' },
      };
    }

    const task: Task = await response.json();
    const formattedDate = formatDateWithDay(normalizedDate);

    return {
      success: true,
      content: {
        task,
        message: `Set due date for "${task.title}" to ${formattedDate}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}

function parseDueDate(dateStr: string): string {
  const lower = dateStr.toLowerCase().trim();
  const today = new Date();

  if (lower === 'today') return formatDateISO(today);
  if (lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  }
  if (lower === 'next week') {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return formatDateISO(d);
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const d = new Date(today);
    const current = today.getDay();
    let diff = dayIndex - current;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return formatDateISO(d);
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return formatDateISO(parsed);

  return dateStr;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateWithDay(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
