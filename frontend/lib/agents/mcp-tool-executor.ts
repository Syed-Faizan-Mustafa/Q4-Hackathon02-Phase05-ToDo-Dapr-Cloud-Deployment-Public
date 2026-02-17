/**
 * MCP Tool Executor Agent
 * Feature: 003-ai-todo-chatbot
 * Task: T014
 *
 * Invokes MCP tools based on parsed intent.
 * Implements FR-056, FR-057 from specification.
 */

import {
  AgentContext,
  AgentResult,
  ToolExecutorOutput,
  ChatIntent,
  Task,
} from './types';
import {
  createMCPClient,
  intentToToolName,
  buildToolArgs,
  MCPContext,
  MCPToolResult,
  MCPToolName,
} from '../mcp';

/**
 * Execute an intent using the MCP Server
 */
export async function executeMCPIntent(
  context: AgentContext,
  intent: ChatIntent
): Promise<AgentResult<ToolExecutorOutput>> {
  try {
    // Map intent to MCP tool name
    const toolName = intentToToolName(intent.intent);

    // Debug logging
    console.log('[MCP-Executor] Processing intent:', {
      intent: intent.intent,
      toolName,
      entities: intent.entities,
    });

    if (!toolName) {
      return {
        success: false,
        error: {
          code: 'unsupported_intent',
          message: 'This action is not supported.',
        },
      };
    }

    // Build MCP context (FR-057 - pass JWT token)
    const mcpContext: MCPContext = {
      userId: context.userId,
      jwtToken: context.jwt,
      backendUrl: context.backendUrl,
    };

    // Create MCP client
    const mcpClient = createMCPClient(mcpContext);

    // Build tool arguments from intent entities
    const toolArgs = buildToolArgs(intent.intent, intent.entities as unknown as Record<string, unknown>);

    // Handle special case: get_task_dates needs to get a specific task
    if (intent.intent === 'get_task_dates') {
      return handleGetTaskDates(context, intent, mcpContext);
    }

    // Handle task resolution by title (or ordinal) if no task_id
    if (needsTaskResolution(intent) && !intent.entities.task_id) {
      const resolvedId = await resolveTaskByTitle(
        context,
        intent.entities.title,
        mcpContext,
        intent.entities.ordinal ?? undefined
      );
      if (!resolvedId.success) {
        return {
          success: false,
          error: resolvedId.error,
        };
      }
      (toolArgs as Record<string, unknown>).task_id = resolvedId.taskId;
    }

    // Execute the MCP tool
    const result = await mcpClient.callTool(toolName, toolArgs);

    // Map MCP result to ToolExecutorOutput
    return mapMCPResultToOutput(intent.intent, result);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'execution_failed',
        message: error instanceof Error ? error.message : 'Failed to execute the action.',
      },
    };
  }
}

/**
 * Check if intent needs task resolution
 */
function needsTaskResolution(intent: ChatIntent): boolean {
  return ['complete_task', 'incomplete_task', 'update_task', 'delete_task', 'set_due_date', 'set_priority', 'add_tags', 'set_recurring'].includes(intent.intent);
}

/**
 * Resolve task ID by title search and/or ordinal position.
 * Tasks are sorted newest-first. ordinal=1 means newest, ordinal=2 means second newest.
 * ordinal=-1 means oldest (last).
 * If title is provided, matches are filtered by title first, then ordinal selects among matches.
 * If only ordinal is provided (no title), it selects from all tasks.
 */
async function resolveTaskByTitle(
  context: AgentContext,
  title: string | null,
  mcpContext: MCPContext,
  ordinal?: number
): Promise<{ success: true; taskId: string } | { success: false; error: { code: string; message: string } }> {
  const mcpClient = createMCPClient(mcpContext);

  // List all tasks
  const listResult = await mcpClient.callTool('list_tasks', { status_filter: 'all' });

  if (!listResult.success || !listResult.content) {
    return {
      success: false,
      error: {
        code: 'backend_error',
        message: 'Failed to search for tasks.',
      },
    };
  }

  const content = listResult.content as { tasks?: Task[] };
  // Tasks come sorted newest-first from the API (created_at desc)
  const tasks = content.tasks || [];

  // If we have a title, filter by title
  let matches = tasks;
  if (title) {
    const searchTitle = title.toLowerCase();
    matches = tasks.filter((t) =>
      t.title.toLowerCase().includes(searchTitle)
    );
  }

  if (matches.length === 0) {
    return {
      success: false,
      error: {
        code: 'task_not_found',
        message: title
          ? `No task found matching "${title}"`
          : 'No tasks found.',
      },
    };
  }

  // If ordinal is specified, use it to select among matches
  if (ordinal !== undefined && ordinal !== null) {
    let index: number;
    if (ordinal === -1) {
      // "last" / "oldest" = last item in newest-first list
      index = matches.length - 1;
    } else {
      // ordinal 1 = newest (index 0), ordinal 2 = second newest (index 1), etc.
      index = ordinal - 1;
    }

    if (index < 0 || index >= matches.length) {
      return {
        success: false,
        error: {
          code: 'task_not_found',
          message: title
            ? `Only ${matches.length} task(s) match "${title}". Cannot select #${ordinal}.`
            : `Only ${matches.length} task(s) exist. Cannot select #${ordinal}.`,
        },
      };
    }

    return { success: true, taskId: matches[index].id };
  }

  // No ordinal: if exactly one match, return it
  if (matches.length === 1) {
    return { success: true, taskId: matches[0].id };
  }

  // Multiple matches without ordinal - ask user to clarify with ordinals
  const taskList = matches
    .slice(0, 5)
    .map((t, i) => `${i + 1}. "${t.title}"`)
    .join('\n');
  return {
    success: false,
    error: {
      code: 'ambiguous_task',
      message: `Multiple tasks match "${title}":\n${taskList}\nSpecify which one: e.g., "delete ${title} 1st" for newest, "2nd" for second newest.`,
    },
  };
}

/**
 * Handle get_task_dates intent
 * Fetches a specific task and returns its due_date info using the native field
 */
async function handleGetTaskDates(
  context: AgentContext,
  intent: ChatIntent,
  mcpContext: MCPContext
): Promise<AgentResult<ToolExecutorOutput>> {
  const mcpClient = createMCPClient(mcpContext);

  // If we have a task_id, fetch that specific task's dates
  if (intent.entities.task_id) {
    // List tasks and find the one matching
    const listResult = await mcpClient.callTool('list_tasks', { status_filter: 'all' });
    if (!listResult.success || !listResult.content) {
      return {
        success: false,
        error: { code: 'backend_error', message: 'Failed to fetch tasks.' },
      };
    }
    const content = listResult.content as { tasks?: Task[] };
    const task = (content.tasks || []).find((t) => t.id === intent.entities.task_id);
    if (!task) {
      return {
        success: false,
        error: { code: 'task_not_found', message: `Task ${intent.entities.task_id} not found` },
      };
    }
    const dueDateStr = task.due_date ? formatDate(task.due_date) : 'no due date set';
    return {
      success: true,
      data: {
        action: 'get_dates',
        result: {
          task,
          message: `"${task.title}" is due ${dueDateStr}.`,
        },
      },
    };
  }

  // If we have a title reference, resolve by title
  if (intent.entities.title) {
    const resolved = await resolveTaskByTitle(context, intent.entities.title, mcpContext);
    if (!resolved.success) {
      return { success: false, error: resolved.error };
    }
    // Fetch the resolved task
    const listResult = await mcpClient.callTool('list_tasks', { status_filter: 'all' });
    if (!listResult.success || !listResult.content) {
      return {
        success: false,
        error: { code: 'backend_error', message: 'Failed to fetch tasks.' },
      };
    }
    const content = listResult.content as { tasks?: Task[] };
    const task = (content.tasks || []).find((t) => t.id === resolved.taskId);
    if (!task) {
      return {
        success: false,
        error: { code: 'task_not_found', message: 'Task not found after resolution.' },
      };
    }
    const dueDateStr = task.due_date ? formatDate(task.due_date) : 'no due date set';
    return {
      success: true,
      data: {
        action: 'get_dates',
        result: {
          task,
          message: `"${task.title}" is due ${dueDateStr}.`,
        },
      },
    };
  }

  // No specific task - show all tasks with due dates
  const listResult = await mcpClient.callTool('list_tasks', { status_filter: 'all' });
  if (!listResult.success || !listResult.content) {
    return {
      success: false,
      error: { code: 'backend_error', message: 'Failed to fetch tasks.' },
    };
  }
  const content = listResult.content as { tasks?: Task[] };
  const tasksWithDates = (content.tasks || []).filter((t) => t.due_date);

  if (tasksWithDates.length === 0) {
    return {
      success: true,
      data: {
        action: 'get_dates',
        result: {
          tasks: [],
          message: 'No tasks have due dates set. / Kisi task ki due date set nahi hai.',
        },
      },
    };
  }

  // Sort by due date ascending
  tasksWithDates.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  return {
    success: true,
    data: {
      action: 'get_dates',
      result: {
        tasks: tasksWithDates,
        message: `${tasksWithDates.length} task(s) have due dates.`,
      },
    },
  };
}

/**
 * Map MCP result to ToolExecutorOutput format
 */
function mapMCPResultToOutput(
  intent: string,
  mcpResult: MCPToolResult
): AgentResult<ToolExecutorOutput> {
  if (!mcpResult.success) {
    return {
      success: false,
      error: {
        code: mcpResult.error?.code || 'execution_failed',
        message: mcpResult.error?.message || 'Operation failed',
      },
    };
  }

  const content = mcpResult.content as Record<string, unknown>;

  // Map intent to action name
  const actionMap: Record<string, string> = {
    add_task: 'create',
    list_tasks: 'list',
    update_task: 'update',
    complete_task: 'complete',
    incomplete_task: 'incomplete',
    delete_task: 'delete',
    set_due_date: 'set_due_date',
    set_priority: 'set_priority',
    add_tags: 'add_tags',
    search_tasks: 'search',
    set_recurring: 'set_recurring',
  };

  return {
    success: true,
    data: {
      action: actionMap[intent] || intent,
      result: {
        task: content.task as Task | undefined,
        tasks: content.tasks as Task[] | undefined,
        deleted: content.deleted as boolean | undefined,
        message: content.message as string | undefined,
      },
    },
  };
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Re-export for backward compatibility
export { executeMCPIntent as executeIntent };
