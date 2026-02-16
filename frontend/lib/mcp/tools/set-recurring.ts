/**
 * MCP Tool: set_recurring
 * Feature: Phase 5 Part A
 *
 * Sets a task as recurring with a pattern (daily/weekly/monthly) via PATCH.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const setRecurringTool: MCPTool = {
  name: 'set_recurring',
  description: 'Set a task as recurring with a pattern (daily, weekly, monthly)',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task (required)',
        minLength: 1,
      },
      recurrence_pattern: {
        type: 'string',
        description: 'Recurrence pattern (required)',
        enum: ['daily', 'weekly', 'monthly'],
      },
      recurrence_interval: {
        type: 'integer',
        description: 'Interval (e.g. every 2 weeks). Defaults to 1.',
        minimum: 1,
        default: 1,
      },
    },
    required: ['task_id', 'recurrence_pattern'],
  },
};

export async function setRecurringHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const task_id = input.task_id as string | undefined;
  const recurrence_pattern = input.recurrence_pattern as string | undefined;
  const recurrence_interval = (input.recurrence_interval as number) || 1;

  if (!task_id || task_id.trim().length === 0) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Valid task ID is required' },
    };
  }

  if (!recurrence_pattern || !['daily', 'weekly', 'monthly'].includes(recurrence_pattern)) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Recurrence pattern must be daily, weekly, or monthly' },
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
      body: JSON.stringify({
        is_recurring: true,
        recurrence_pattern,
        recurrence_interval,
      }),
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
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to set recurring' },
      };
    }

    const task: Task = await response.json();
    const intervalStr = recurrence_interval > 1 ? ` every ${recurrence_interval}` : '';
    const patternStr = recurrence_pattern === 'daily' ? 'day(s)' : recurrence_pattern === 'weekly' ? 'week(s)' : 'month(s)';

    return {
      success: true,
      content: {
        task,
        message: `"${task.title}" will now repeat${intervalStr} ${patternStr}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}
