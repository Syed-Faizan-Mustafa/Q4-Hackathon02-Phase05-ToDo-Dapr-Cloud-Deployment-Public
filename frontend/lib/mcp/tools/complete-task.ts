/**
 * MCP Tool: complete_task
 * Feature: 003-ai-todo-chatbot
 * Task: T045
 *
 * Marks a task as completed.
 * Implements FR-065 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  CompleteTaskInput,
  Task,
} from '../types';

export const completeTaskTool: MCPTool = {
  name: 'complete_task',
  description: 'Mark a task as completed',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task to complete (required)',
        minLength: 1,
      },
    },
    required: ['task_id'],
  },
};

export async function completeTaskHandler(
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
    // Use PATCH for partial updates, backend uses 'completed' field
    const response = await fetch(
      `${context.backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
        body: JSON.stringify({
          completed: true,
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
          message: errorData.detail || 'Failed to complete task',
        },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: {
        task,
        message: `Marked "${task.title}" as complete`,
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
