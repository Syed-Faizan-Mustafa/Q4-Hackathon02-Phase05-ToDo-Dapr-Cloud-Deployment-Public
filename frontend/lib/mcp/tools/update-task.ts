/**
 * MCP Tool: update_task
 * Feature: 003-ai-todo-chatbot
 * Task: T052
 *
 * Updates an existing task's title or description.
 * Implements FR-064 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  UpdateTaskInput,
  Task,
} from '../types';

export const updateTaskTool: MCPTool = {
  name: 'update_task',
  description: 'Update an existing task\'s title or description',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task to update (required)',
        minLength: 1,
      },
      title: {
        type: 'string',
        description: 'New task title',
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        description: 'New task description',
        maxLength: 1000,
      },
    },
    required: ['task_id'],
  },
};

export async function updateTaskHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const task_id = input.task_id as string | undefined;
  const title = input.title as string | undefined;
  const description = input.description as string | undefined;

  if (!task_id || task_id.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Valid task ID is required',
      },
    };
  }

  const updateData: Record<string, string> = {};
  if (title) {
    updateData.title = title.trim();
  }
  if (description !== undefined) {
    updateData.description = description.trim();
  }

  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Please specify what to update (title or description)',
      },
    };
  }

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
        body: JSON.stringify(updateData),
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
          message: errorData.detail || 'Failed to update task',
        },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: {
        task,
        message: `Updated task "${task.title}"`,
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
