/**
 * MCP Tool: incomplete_task
 * Feature: 003-ai-todo-chatbot
 *
 * Marks a completed task as incomplete (pending).
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const incompleteTaskTool: MCPTool = {
  name: 'incomplete_task',
  description: 'Mark a completed task as incomplete (pending)',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task to mark as incomplete (required)',
        minLength: 1,
      },
    },
    required: ['task_id'],
  },
};

export async function incompleteTaskHandler(
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
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(
      `${backendUrl}/api/v1/tasks/${task_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.jwtToken}`,
        },
        body: JSON.stringify({
          completed: false,
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
          message: errorData.detail || 'Failed to mark task as incomplete',
        },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: {
        task,
        message: `Marked "${task.title}" as incomplete`,
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
