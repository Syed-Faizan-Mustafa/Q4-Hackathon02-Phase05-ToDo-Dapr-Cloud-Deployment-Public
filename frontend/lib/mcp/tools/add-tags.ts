/**
 * MCP Tool: add_tags
 * Feature: Phase 5 Part A
 *
 * Adds tags to a task via PATCH. Merges with existing tags.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  Task,
} from '../types';

export const addTagsTool: MCPTool = {
  name: 'add_tags',
  description: 'Add tags to a task (merges with existing tags)',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'UUID of the task (required)',
        minLength: 1,
      },
      tags: {
        type: 'array',
        description: 'Tags to add (required)',
        items: { type: 'string' },
      },
    },
    required: ['task_id', 'tags'],
  },
};

export async function addTagsHandler(
  input: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const task_id = input.task_id as string | undefined;
  const newTags = input.tags as string[] | undefined;

  if (!task_id || task_id.trim().length === 0) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Valid task ID is required' },
    };
  }

  if (!newTags || newTags.length === 0) {
    return {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'At least one tag is required' },
    };
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // First, get the current task to merge tags
    const getResponse = await fetch(`${backendUrl}/api/v1/tasks/${task_id}`, {
      headers: {
        Authorization: `Bearer ${context.jwtToken}`,
      },
    });

    if (!getResponse.ok) {
      if (getResponse.status === 401) {
        return {
          success: false,
          error: { code: 'AUTH_EXPIRED', message: 'Session expired. Please sign in again.' },
        };
      }
      if (getResponse.status === 404) {
        return {
          success: false,
          error: { code: 'TASK_NOT_FOUND', message: `Task ${task_id} not found` },
        };
      }
      return {
        success: false,
        error: { code: 'BACKEND_ERROR', message: 'Failed to fetch task' },
      };
    }

    const currentTask: Task = await getResponse.json();
    const existingTags = currentTask.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...newTags.map(t => t.toLowerCase())]));

    // Update with merged tags
    const response = await fetch(`${backendUrl}/api/v1/tasks/${task_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.jwtToken}`,
      },
      body: JSON.stringify({ tags: mergedTags }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to add tags' },
      };
    }

    const task: Task = await response.json();

    return {
      success: true,
      content: {
        task,
        message: `Added tags [${newTags.join(', ')}] to "${task.title}"`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}
