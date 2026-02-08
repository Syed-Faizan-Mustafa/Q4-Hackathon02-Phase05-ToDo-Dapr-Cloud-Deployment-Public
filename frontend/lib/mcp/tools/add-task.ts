/**
 * MCP Tool: add_task
 * Feature: 003-ai-todo-chatbot
 * Task: T032
 *
 * Creates a new task via Phase II backend API.
 * Implements FR-062 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  AddTaskInput,
  Task,
} from '../types';

export const addTaskTool: MCPTool = {
  name: 'add_task',
  description: 'Add a new task to the user\'s todo list',
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
      due_date: {
        type: 'string',
        description: 'Due date in ISO 8601 format (optional)',
        format: 'date',
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
  const due_date = input.due_date as string | undefined;

  if (!title || title.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Task title is required',
      },
    };
  }

  // Build full description including due date if provided
  // (Backend doesn't have due_date field, so we include it in description)
  let fullDescription = description?.trim() || '';
  if (due_date) {
    const formattedDueDate = formatDueDateForDisplay(due_date);
    if (fullDescription) {
      fullDescription = `${fullDescription}\n📅 Due: ${formattedDueDate}`;
    } else {
      fullDescription = `📅 Due: ${formattedDueDate}`;
    }
  }

  try {
    // Use the backend URL from environment (same as /api/tasks route)
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Backend API: /api/v1/tasks - pass session token for auth
    const response = await fetch(
      `${backendUrl}/api/v1/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: fullDescription || null,
        }),
      }
    );

    // Log for debugging
    console.log('[MCP add_task] Backend response status:', response.status);

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
      const errorData = await response.json().catch(() => ({}));
      console.error('[MCP add_task] Backend error:', errorData);
      return {
        success: false,
        error: {
          code: 'BACKEND_ERROR',
          message: errorData.detail || 'Failed to create task',
        },
      };
    }

    const task: Task = await response.json();
    console.log('[MCP add_task] Task created:', task.id);

    // Add due date to the response message if provided
    let message = `Created task "${task.title}"`;
    if (due_date) {
      message += ` (Due: ${formatDueDateForDisplay(due_date)})`;
    }

    return {
      success: true,
      content: {
        task,
        due_date: due_date || null,
        message,
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
 * Format due date for user-friendly display
 */
function formatDueDateForDisplay(dateStr: string): string {
  // If it's already a formatted date like "2026-02-09", convert to readable format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) {
      return 'Today / Aaj';
    }
    if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow / Kal';
    }

    // Format with day name
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }

  // Return as-is if not in ISO format
  return dateStr;
}
