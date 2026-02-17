/**
 * MCP Server Implementation
 * Feature: 003-ai-todo-chatbot
 * Task: T007
 *
 * MCP Server with tool registry pattern for Todo CRUD operations.
 * Implements FR-044 to FR-051 from specification.
 */

import {
  MCPTool,
  MCPContext,
  MCPToolResult,
  MCPToolName,
  MCP_TOOL_NAMES,
} from './types';
import { addTaskTool, addTaskHandler } from './tools/add-task';
import { listTasksTool, listTasksHandler } from './tools/list-tasks';
import { updateTaskTool, updateTaskHandler } from './tools/update-task';
import { completeTaskTool, completeTaskHandler } from './tools/complete-task';
import { incompleteTaskTool, incompleteTaskHandler } from './tools/incomplete-task';
import { deleteTaskTool, deleteTaskHandler } from './tools/delete-task';
import { setDueDateTool, setDueDateHandler } from './tools/set-due-date';
import { setPriorityTool, setPriorityHandler } from './tools/set-priority';
import { addTagsTool, addTagsHandler } from './tools/add-tags';
import { searchTasksTool, searchTasksHandler } from './tools/search-tasks';
import { setRecurringTool, setRecurringHandler } from './tools/set-recurring';

// =============================================================================
// Tool Registry
// =============================================================================

interface ToolRegistryEntry {
  tool: MCPTool;
  handler: (input: Record<string, unknown>, context: MCPContext) => Promise<MCPToolResult>;
}

const toolRegistry: Map<MCPToolName, ToolRegistryEntry> = new Map([
  ['add_task', { tool: addTaskTool, handler: addTaskHandler }],
  ['list_tasks', { tool: listTasksTool, handler: listTasksHandler }],
  ['update_task', { tool: updateTaskTool, handler: updateTaskHandler }],
  ['complete_task', { tool: completeTaskTool, handler: completeTaskHandler }],
  ['incomplete_task', { tool: incompleteTaskTool, handler: incompleteTaskHandler }],
  ['delete_task', { tool: deleteTaskTool, handler: deleteTaskHandler }],
  ['set_due_date', { tool: setDueDateTool, handler: setDueDateHandler }],
  ['set_priority', { tool: setPriorityTool, handler: setPriorityHandler }],
  ['add_tags', { tool: addTagsTool, handler: addTagsHandler }],
  ['search_tasks', { tool: searchTasksTool, handler: searchTasksHandler }],
  ['set_recurring', { tool: setRecurringTool, handler: setRecurringHandler }],
]);

// =============================================================================
// MCP Server Functions
// =============================================================================

/**
 * List all available MCP tools (FR-045)
 */
export function listTools(): MCPTool[] {
  return Array.from(toolRegistry.values()).map((entry) => entry.tool);
}

/**
 * Get a specific tool by name
 */
export function getTool(name: string): MCPTool | undefined {
  return toolRegistry.get(name as MCPToolName)?.tool;
}

/**
 * Call an MCP tool with given arguments (FR-046, FR-047)
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const startTime = performance.now();
  const invocationId = generateInvocationId(name);

  // Log tool invocation start (FR-051)
  logToolInvocation('start', invocationId, name, args);

  // Validate tool exists
  const entry = toolRegistry.get(name as MCPToolName);
  if (!entry) {
    const error: MCPToolResult = {
      success: false,
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Unknown tool: ${name}. Available tools: ${MCP_TOOL_NAMES.join(', ')}`,
      },
    };
    logToolInvocation('error', invocationId, name, args, error, performance.now() - startTime);
    return error;
  }

  // Validate JWT token (FR-048)
  if (!context.jwtToken) {
    const error: MCPToolResult = {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication token is required',
      },
    };
    logToolInvocation('error', invocationId, name, args, error, performance.now() - startTime);
    return error;
  }

  try {
    // Execute tool handler
    const result = await entry.handler(args, context);
    const duration = performance.now() - startTime;

    // Log tool invocation completion (FR-051)
    logToolInvocation('complete', invocationId, name, args, result, duration);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorResult: MCPToolResult = {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Tool execution failed',
      },
    };

    logToolInvocation('error', invocationId, name, args, errorResult, duration);
    return errorResult;
  }
}

/**
 * Validate tool input against its schema
 */
export function validateToolInput(
  name: string,
  args: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const entry = toolRegistry.get(name as MCPToolName);
  if (!entry) {
    return { valid: false, errors: [`Unknown tool: ${name}`] };
  }

  const schema = entry.tool.inputSchema;
  const errors: string[] = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in args) || args[field] === undefined || args[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Validate field types
  for (const [field, value] of Object.entries(args)) {
    const propSchema = schema.properties[field];
    if (!propSchema) {
      continue; // Extra fields are ignored
    }

    if (propSchema.type === 'string' && typeof value !== 'string') {
      errors.push(`Field ${field} must be a string`);
    } else if (propSchema.type === 'number' && typeof value !== 'number') {
      errors.push(`Field ${field} must be a number`);
    } else if (propSchema.type === 'integer' && (!Number.isInteger(value))) {
      errors.push(`Field ${field} must be an integer`);
    } else if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Field ${field} must be a boolean`);
    }

    // Validate enum values
    if (propSchema.enum && !propSchema.enum.includes(value as string)) {
      errors.push(`Field ${field} must be one of: ${propSchema.enum.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate unique invocation ID
 */
function generateInvocationId(toolName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${toolName}-${timestamp}-${random}`;
}

// =============================================================================
// Logging (FR-051)
// =============================================================================

interface ToolInvocationLog {
  invocationId: string;
  toolName: string;
  status: 'start' | 'complete' | 'error';
  timestamp: string;
  duration?: number;
}

/**
 * Log MCP tool invocation (FR-051 - without sensitive data)
 */
function logToolInvocation(
  status: 'start' | 'complete' | 'error',
  invocationId: string,
  toolName: string,
  _args: Record<string, unknown>,
  result?: MCPToolResult,
  duration?: number
): void {
  const log: ToolInvocationLog = {
    invocationId,
    toolName,
    status,
    timestamp: new Date().toISOString(),
  };

  if (duration !== undefined) {
    log.duration = Math.round(duration);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    if (status === 'start') {
      console.log(`[MCP] Tool invocation started:`, log);
    } else if (status === 'complete') {
      console.log(`[MCP] Tool invocation completed:`, log, 'success:', result?.success);
    } else {
      console.error(`[MCP] Tool invocation failed:`, log, 'error:', result?.error);
    }
  }
}

// =============================================================================
// MCP Server Info
// =============================================================================

export const mcpServerInfo = {
  name: 'todo-mcp-server',
  version: '1.0.0',
  description: 'MCP Server for Todo Task Management',
  tools: MCP_TOOL_NAMES,
};
