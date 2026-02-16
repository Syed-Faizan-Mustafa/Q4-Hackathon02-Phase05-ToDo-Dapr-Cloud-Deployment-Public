/**
 * MCP Tool: list_tasks
 * Feature: Phase 5 Part A
 *
 * Lists user's tasks with status, priority, search, sort, and overdue filters.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const listTasksTool: MCPTool = {
  name: 'list_tasks',
  description: 'List user\'s tasks with optional filters: status, priority, search, sort, overdue',
  inputSchema: {
    type: 'object',
    properties: {
      status_filter: {
        type: 'string',
        description: 'Filter tasks by status',
        enum: ['pending', 'completed', 'all'],
        default: 'all',
      },
      priority: {
        type: 'string',
        description: 'Filter by priority level',
        enum: ['high', 'medium', 'low'],
      },
      search: {
        type: 'string',
        description: 'Search tasks by title/description',
      },
      sort_by: {
        type: 'string',
        description: 'Sort field',
        enum: ['created_at', 'title', 'due_date', 'priority'],
        default: 'created_at',
      },
      sort_dir: {
        type: 'string',
        description: 'Sort direction',
        enum: ['asc', 'desc'],
        default: 'desc',
      },
      overdue: {
        type: 'boolean',
        description: 'Show only overdue tasks',
      },
    },
  },
};

export async function listTasksHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const status_filter = input.status_filter as string | undefined;
  const priority = input.priority as string | undefined;
  const search = input.search as string | undefined;
  const sort_by = input.sort_by as string | undefined;
  const sort_dir = input.sort_dir as string | undefined;
  const overdue = input.overdue as boolean | undefined;

  try {
    const params = new URLSearchParams();

    if (status_filter && status_filter !== 'all') {
      params.set('status', status_filter);
    }
    if (priority) params.set('priority', priority);
    if (search) params.set('search', search);
    if (sort_by) params.set('sort_by', sort_by);
    if (sort_dir) params.set('sort_dir', sort_dir);
    if (overdue) params.set('overdue', 'true');

    const queryString = params.toString();
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const endpoint = `${backendUrl}/api/v1/tasks${queryString ? `?${queryString}` : ''}`;

    console.log('[MCP list_tasks] Fetching from:', endpoint);

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
          error: { code: 'AUTH_EXPIRED', message: 'Session expired. Please sign in again.' },
        };
      }
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to fetch tasks' },
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
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}
