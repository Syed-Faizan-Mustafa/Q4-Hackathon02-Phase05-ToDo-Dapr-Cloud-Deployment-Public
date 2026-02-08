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

    // Handle task resolution by title if no task_id
    if (needsTaskResolution(intent) && !intent.entities.task_id && intent.entities.title) {
      const resolvedId = await resolveTaskByTitle(context, intent.entities.title, mcpContext);
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
  return ['complete_task', 'update_task', 'delete_task', 'set_due_date'].includes(intent.intent);
}

/**
 * Resolve task ID by title search
 */
async function resolveTaskByTitle(
  context: AgentContext,
  title: string,
  mcpContext: MCPContext
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
  const tasks = content.tasks || [];
  const searchTitle = title.toLowerCase();

  // Find matching tasks
  const matches = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchTitle)
  );

  if (matches.length === 0) {
    return {
      success: false,
      error: {
        code: 'task_not_found',
        message: `No task found matching "${title}"`,
      },
    };
  }

  if (matches.length > 1) {
    const taskList = matches
      .slice(0, 3)
      .map((t) => `#${t.id}: ${t.title}`)
      .join(', ');
    return {
      success: false,
      error: {
        code: 'ambiguous_task',
        message: `Multiple tasks match. Please specify by ID: ${taskList}`,
      },
    };
  }

  return { success: true, taskId: matches[0].id };
}

/**
 * Handle get_task_dates intent
 * Note: Due dates feature is not supported in the current backend
 */
async function handleGetTaskDates(
  context: AgentContext,
  intent: ChatIntent,
  mcpContext: MCPContext
): Promise<AgentResult<ToolExecutorOutput>> {
  // Due dates feature is not supported in the current backend API
  return {
    success: true,
    data: {
      action: 'get_dates',
      result: {
        message: 'Due dates feature is not available. / Due date feature abhi available nahi hai.',
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
    delete_task: 'delete',
    set_due_date: 'set_due_date',
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
