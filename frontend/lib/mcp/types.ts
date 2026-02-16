/**
 * MCP Type Definitions
 * Feature: 003-ai-todo-chatbot / Phase 5 Part A
 *
 * TypeScript interfaces for MCP (Model Context Protocol) Server integration.
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
  type: 'string' | 'number' | 'boolean' | 'integer' | 'array';
  description: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  format?: string;
  default?: unknown;
  items?: { type: string };
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
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  due_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_interval?: number;
}

export interface ListTasksInput {
  status_filter?: 'pending' | 'completed' | 'all';
  priority?: 'high' | 'medium' | 'low';
  search?: string;
  sort_by?: 'created_at' | 'title' | 'due_date' | 'priority';
  sort_dir?: 'asc' | 'desc';
  overdue?: boolean;
}

export interface UpdateTaskInput {
  task_id: string;
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  due_date?: string;
}

export interface CompleteTaskInput {
  task_id: string;
}

export interface DeleteTaskInput {
  task_id: string;
}

export interface SetDueDateInput {
  task_id: string;
  due_date: string;
}

// =============================================================================
// MCP Tool Output Types
// =============================================================================

// Task type from Phase II backend - Phase 5 enhanced
export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  due_date: string | null;
  remind_at: string | null;
  reminder_sent: boolean;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_interval: number;
  parent_task_id: string | null;
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
  'set_priority',
  'add_tags',
  'search_tasks',
  'set_recurring',
] as const;

export type MCPToolName = typeof MCP_TOOL_NAMES[number];
