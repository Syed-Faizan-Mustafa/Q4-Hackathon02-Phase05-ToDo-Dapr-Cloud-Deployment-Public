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
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // First, get the current task to preserve existing description
    const getResponse = await fetch(
      `${backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      if (getResponse.status === 401) {
        return {
          success: false,
          error: {
            code: 'AUTH_EXPIRED',
            message: 'Session expired. Please sign in again.',
          },
        };
      }
      if (getResponse.status === 404) {
        return {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: `Task ${task_id} not found`,
          },
        };
      }
    }

    const currentTask: Task = await getResponse.json();

    // Build new description with due date
    // Remove any existing due date marker first
    let existingDesc = currentTask.description || '';
    existingDesc = existingDesc.replace(/\n?📅 Due:.*$/m, '').trim();

    // Format the due date with day name
    const formattedDate = formatDateWithDay(normalizedDate);
    const newDescription = existingDesc
      ? `${existingDesc}\n📅 Due: ${formattedDate}`
      : `📅 Due: ${formattedDate}`;

    // Backend API: /api/v1/tasks - update description to include due date
    // (Backend doesn't have native due_date field)
    const response = await fetch(
      `${backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
        body: JSON.stringify({
          description: newDescription,
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
        message: `Set due date for "${task.title}" to ${formattedDate}`,
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
 * Format date for display (simple format)
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

/**
 * Format date with full day name for storage in description
 * Example: "Wednesday, Feb 26, 2026"
 */
function formatDateWithDay(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // For today/tomorrow, also show the actual date
    if (date.getTime() === today.getTime()) {
      return `Today (${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })})`;
    }
    if (date.getTime() === tomorrow.getTime()) {
      return `Tomorrow (${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })})`;
    }

    // Full format with day name
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
