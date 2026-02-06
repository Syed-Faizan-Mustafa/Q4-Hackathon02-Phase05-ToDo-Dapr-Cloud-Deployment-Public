/**
 * MCP Tool: delete_task
 * Feature: 003-ai-todo-chatbot
 * Task: T059
 *
 * Deletes a task from the user's todo list.
 * Implements FR-066 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  DeleteTaskInput,
  Task,
} from '../types';

export const deleteTaskTool: MCPTool = {
  name: 'delete_task',
  description: 'Delete a task from the user\'s todo list',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task to delete (required)',
        minLength: 1,
      },
    },
    required: ['task_id'],
  },
};

export async function deleteTaskHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const task_id = input.task_id as string | undefined;

  if (!task_id || task_id.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Valid task ID is required',
      },
    };
  }

  try {
    // Backend API: /api/v1/tasks - user is determined from JWT token
    // First, get the task to return its title in the message
    const getResponse = await fetch(
      `${context.backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
      }
    );

    let taskTitle = `Task ${task_id}`;
    if (getResponse.ok) {
      const task: Task = await getResponse.json();
      taskTitle = task.title;
    }

    // Delete the task
    const response = await fetch(
      `${context.backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
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
          message: errorData.detail || 'Failed to delete task',
        },
      };
    }

    return {
      success: true,
      content: {
        deleted: true,
        task_id,
        message: `Deleted task "${taskTitle}"`,
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
