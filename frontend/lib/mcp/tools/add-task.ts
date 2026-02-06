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

  try {
    // Backend API: /api/v1/tasks - user is determined from JWT token
    const response = await fetch(
      `${context.backendUrl}/api/v1/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description?.trim() || null,
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
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: 'BACKEND_ERROR',
          message: errorData.detail || 'Failed to create task',
        },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: {
        task,
        message: `Created task "${task.title}"`,
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
