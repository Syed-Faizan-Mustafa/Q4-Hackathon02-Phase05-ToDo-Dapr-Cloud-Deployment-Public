/**
 * MCP Tool: set_due_date
 * Feature: 003-ai-todo-chatbot
 * Task: T065
 *
 * Sets or updates the due date for a task.
 * Implements FR-067 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  SetDueDateInput,
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
        description: 'Due date in ISO 8601 format (required)',
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
      error: {
        code: 'INVALID_INPUT',
        message: 'Valid task ID is required',
      },
    };
  }

  if (!due_date) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Due date is required',
      },
    };
  }

  // Parse and normalize the due date
  const normalizedDate = parseDueDate(due_date);

  try {
    // Use the backend URL from environment (same as /api/tasks route)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000';

    // Backend API: /api/v1/tasks - user is determined from JWT token
    // Use PATCH for partial updates
    const response = await fetch(
      `${backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
        body: JSON.stringify({
          due_date: normalizedDate,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: {
            code: 'AUTH_EXPIRED',
            message: 'Session expired. Please sign in again.',
          },
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: `Task ${task_id} not found`,
          },
        };
      }
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: 'BACKEND_ERROR',
          message: errorData.detail || 'Failed to set due date',
        },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: {
        task,
        message: `Set due date for "${task.title}" to ${formatDate(normalizedDate)}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

/**
 * Parse and normalize due date (handles relative dates)
 */
function parseDueDate(dateStr: string): string {
  const lower = dateStr.toLowerCase().trim();
  const today = new Date();

  // Handle relative dates
  if (lower === 'today') {
    return formatDateISO(today);
  }

  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateISO(tomorrow);
  }

  if (lower === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDateISO(nextWeek);
  }

  // Handle day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const targetDay = new Date(today);
    const currentDay = today.getDay();
    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    targetDay.setDate(targetDay.getDate() + daysUntil);
    return formatDateISO(targetDay);
  }

  // Try to parse as ISO date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return formatDateISO(parsed);
  }

  // Return as-is if we can't parse it
  return dateStr;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
