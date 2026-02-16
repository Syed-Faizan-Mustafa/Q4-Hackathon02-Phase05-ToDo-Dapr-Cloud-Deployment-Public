/**
 * MCP Client Implementation
 * Feature: 003-ai-todo-chatbot
 * Task: T008
 *
 * Client for invoking MCP tools from the agent pipeline.
 * Implements FR-050 from specification.
 */

import { MCPContext, MCPToolResult, MCPToolName } from './types';
import { callTool, listTools, validateToolInput } from './server';

// =============================================================================
// MCP Client Interface
// =============================================================================

export interface MCPClient {
  /**
   * Execute an MCP tool by name
   */
  callTool(name: MCPToolName, args: Record<string, unknown>): Promise<MCPToolResult>;

  /**
   * List all available tools
   */
  listTools(): ReturnType<typeof listTools>;

  /**
   * Validate tool input
   */
  validateInput(name: string, args: Record<string, unknown>): ReturnType<typeof validateToolInput>;
}

// =============================================================================
// MCP Client Factory
// =============================================================================

/**
 * Create an MCP client instance with the given context
 */
export function createMCPClient(context: MCPContext): MCPClient {
  return {
    async callTool(name: MCPToolName, args: Record<string, unknown>): Promise<MCPToolResult> {
      // Validate input before calling
      const validation = validateToolInput(name, args);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join('; '),
          },
        };
      }

      return callTool(name, args, context);
    },

    listTools() {
      return listTools();
    },

    validateInput(name: string, args: Record<string, unknown>) {
      return validateToolInput(name, args);
    },
  };
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Execute an MCP tool directly (convenience wrapper)
 */
export async function executeMCPTool(
  name: MCPToolName,
  args: Record<string, unknown>,
  context: MCPContext
): Promise<MCPToolResult> {
  const client = createMCPClient(context);
  return client.callTool(name, args);
}

/**
 * Map intent to MCP tool name
 */
export function intentToToolName(intent: string): MCPToolName | null {
  const mapping: Record<string, MCPToolName> = {
    add_task: 'add_task',
    list_tasks: 'list_tasks',
    update_task: 'update_task',
    complete_task: 'complete_task',
    delete_task: 'delete_task',
    set_due_date: 'set_due_date',
    get_task_dates: 'list_tasks', // Map to list_tasks with task_id filter
    set_priority: 'set_priority',
    add_tags: 'add_tags',
    search_tasks: 'search_tasks',
    set_recurring: 'set_recurring',
  };

  return mapping[intent] || null;
}

/**
 * Build MCP tool arguments from intent entities
 * Only include non-null values to avoid backend validation errors
 */
export function buildToolArgs(
  intent: string,
  entities: Record<string, unknown>
): Record<string, unknown> {
  // Helper to filter out null/undefined values
  const filterNulls = (obj: Record<string, unknown>): Record<string, unknown> => {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
    );
  };

  switch (intent) {
    case 'add_task':
      return filterNulls({
        title: entities.title,
        description: entities.description,
        priority: entities.priority,
        tags: entities.tags,
        due_date: entities.due_date,
      });

    case 'list_tasks':
      return filterNulls({
        status_filter: entities.status_filter || 'all',
        priority: entities.priority,
        search: entities.search,
      });

    case 'update_task':
      // For update_task from pattern matching:
      // entities.title = task reference (used to resolve task_id)
      // entities.description = new title value (what to update the title to)
      return filterNulls({
        task_id: entities.task_id,
        title: entities.description, // Only the new title value, NOT the task reference
        priority: entities.priority,
        tags: entities.tags,
      });

    case 'complete_task':
      return filterNulls({
        task_id: entities.task_id,
      });

    case 'delete_task':
      return filterNulls({
        task_id: entities.task_id,
      });

    case 'set_due_date':
      return filterNulls({
        task_id: entities.task_id,
        due_date: entities.due_date,
      });

    case 'get_task_dates':
      // For get_task_dates, we need to get a specific task
      // This will be handled differently in the tool executor
      return filterNulls({
        task_id: entities.task_id,
      });

    case 'set_priority':
      return filterNulls({
        task_id: entities.task_id,
        priority: entities.priority,
      });

    case 'add_tags':
      return filterNulls({
        task_id: entities.task_id,
        tags: entities.tags,
      });

    case 'search_tasks':
      return filterNulls({
        query: entities.search,
        status_filter: entities.status_filter,
      });

    case 'set_recurring':
      return filterNulls({
        task_id: entities.task_id,
        recurrence_pattern: entities.description, // Pattern stored in description by extractor
        recurrence_interval: 1,
      });

    default:
      return {};
  }
}
