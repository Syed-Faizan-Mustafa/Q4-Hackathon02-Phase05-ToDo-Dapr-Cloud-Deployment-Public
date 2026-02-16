/**
 * MCP Tool: set_priority
 * Feature: Phase 5 Part A
 *
 * Sets or updates the priority of a task via PATCH.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const setPriorityTool: MCPTool = {
  name: 'set_priority',
  description: 'Set or update the priority of a task (high, medium, low)',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task (required)',
        minLength: 1,
      },
      priority: {
        type: 'string',
        description: 'Priority level (required)',
        enum: ['high', 'medium', 'low'],
      },
    },
    required: ['task_id', 'priority'],
  },
};

export async function setPriorityHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const task_id = input.task_id as string | undefined;
  const priority = input.priority as string | undefined;

  if (!task_id || task_id.trim().length === 0) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Valid task ID is required' },
    };
  }

  if (!priority || !['high', 'medium', 'low'].includes(priority)) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Priority must be high, medium, or low' },
    };
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/v1/tasks/${task_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.jwtToken}`,
      },
      body: JSON.stringify({ priority }),
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
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to set priority' },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: { task, message: `Set "${task.title}" priority to ${priority}` },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}
