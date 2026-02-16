/**
 * MCP Tool: search_tasks
 * Feature: Phase 5 Part A
 *
 * Searches tasks by title/description using backend ILIKE search.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const searchTasksTool: MCPTool = {
  name: 'search_tasks',
  description: 'Search tasks by title or description keyword',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (required)',
        minLength: 1,
      },
      status_filter: {
        type: 'string',
        description: 'Filter by status',
        enum: ['pending', 'completed', 'all'],
      },
    },
    required: ['query'],
  },
};

export async function searchTasksHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const query = input.query as string | undefined;
  const statusFilter = (input.status_filter as string) || 'all';

  if (!query || query.trim().length === 0) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Search query is required' },
    };
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const params = new URLSearchParams();
    params.set('search', query.trim());
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }

    const response = await fetch(`${backendUrl}/api/v1/tasks?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${context.jwtToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: { code: 'AUTH_EXPIRED', message: 'Session expired. Please sign in again.' },
        };
      }
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Search failed' },
      };
    }

    const tasks: Task[] = await response.json();

    return {
      success: true,
      content: {
        tasks,
        message: tasks.length > 0
          ? `Found ${tasks.length} task(s) matching "${query}"`
          : `No tasks found matching "${query}"`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}
