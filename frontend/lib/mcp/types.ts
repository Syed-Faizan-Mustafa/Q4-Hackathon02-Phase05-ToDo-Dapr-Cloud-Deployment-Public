/**
 * MCP Type Definitions
 * Feature: 003-ai-todo-chatbot
 * Task: T006
 *
 * TypeScript interfaces for MCP (Model Context Protocol) Server integration.
 * Based on contracts/mcp-tools.json schema definitions.
 */

// =============================================================================
// MCP Core Types
// =============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'integer';
  description: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  format?: string;
  default?: unknown;
}

// =============================================================================
// MCP Tool Invocation
// =============================================================================

export interface MCPToolInvocation {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: Date;
  duration?: number;
  result?: MCPToolResult;
}

export interface MCPToolResult {
  success: boolean;
  content?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: string;
  message: string;
}

// =============================================================================
// MCP JSON-RPC Types
// =============================================================================

export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: 'tools/list' | 'tools/call';
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// =============================================================================
// MCP Context
// =============================================================================

export interface MCPContext {
  userId: string;
  jwtToken: string;
  backendUrl: string;
}

// =============================================================================
// MCP Tool Input Schemas
// =============================================================================

export interface AddTaskInput {
  title: string;
  description?: string;
  due_date?: string;
}

export interface ListTasksInput {
  status_filter?: 'pending' | 'completed' | 'all';
}

export interface UpdateTaskInput {
  task_id: string;  // Backend uses UUID
  title?: string;
  description?: string;
}

export interface CompleteTaskInput {
  task_id: string;  // Backend uses UUID
}

export interface DeleteTaskInput {
  task_id: string;  // Backend uses UUID
}

export interface SetDueDateInput {
  task_id: string;  // Backend uses UUID
  due_date: string;
}

// =============================================================================
// MCP Tool Output Types
// =============================================================================

// Task type from Phase II backend
// Backend uses 'completed' field (not 'is_completed')
// Task IDs are UUIDs (strings), not integers
// Note: Backend does NOT have due_date or completed_at fields
export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface TaskToolOutput {
  success: boolean;
  task?: Task;
  error?: MCPError;
}

export interface TaskListOutput {
  success: boolean;
  tasks?: Task[];
  total_count?: number;
  error?: MCPError;
}

export interface DeleteTaskOutput {
  success: boolean;
  deleted?: boolean;
  error?: MCPError;
}

// =============================================================================
// Tool Handler Type
// =============================================================================

export type MCPToolHandler<TInput, TOutput> = (
  input: TInput,
  context: MCPContext
) => Promise<TOutput>;

// =============================================================================
// Constants
// =============================================================================

export const MCP_TOOL_NAMES = [
  'add_task',
  'list_tasks',
  'update_task',
  'complete_task',
  'delete_task',
  'set_due_date',
] as const;

export type MCPToolName = typeof MCP_TOOL_NAMES[number];
