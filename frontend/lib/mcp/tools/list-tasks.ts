/**
 * MCP Tool: list_tasks
 * Feature: 003-ai-todo-chatbot
 * Task: T038
 *
 * Lists user's tasks with optional status filter.
 * Implements FR-063 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  ListTasksInput,
  Task,
} from '../types';

export const listTasksTool: MCPTool = {
  name: 'list_tasks',
  description: 'List user\'s tasks with optional status filter',
  inputSchema: {
    type: 'object',
    properties: {
      status_filter: {
        type: 'string',
        description: 'Filter tasks by status',
        enum: ['pending', 'completed', 'all'],
        default: 'all',
      },
    },
  },
};

export async function listTasksHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const { status_filter } = input as ListTasksInput;

  try {
    const params = new URLSearchParams();

    if (status_filter === 'pending') {
      params.set('completed', 'false');
    } else if (status_filter === 'completed') {
      params.set('completed', 'true');
    }

    const queryString = params.toString();
    // Backend API: /api/v1/tasks - user is determined from JWT token
    const endpoint = `${context.backendUrl}/api/v1/tasks${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.jwtToken}`,
      },
    });

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
          message: errorData.detail || 'Failed to fetch tasks',
        },
      };
    }

    const tasks: Task[] = await response.json();

    return {
      success: true,
      content: {
        tasks,
        total_count: tasks.length,
        message: tasks.length > 0
          ? `Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}`
          : 'No tasks found',
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
