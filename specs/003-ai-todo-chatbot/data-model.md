# Data Model: AI Todo Chatbot with MCP Server

**Feature**: 003-ai-todo-chatbot
**Date**: 2026-02-03
**Updated**: 2026-02-06
**Status**: Complete (v2 - MCP Server Integration)

## Overview

This document defines the TypeScript interfaces and types for the AI Todo Chatbot feature with MCP (Model Context Protocol) Server integration. The chatbot is stateless (no database), so all types represent in-memory/session data structures.

---

## MCP Types (NEW - v2)

### MCPTool

Represents a registered MCP tool.

```typescript
interface MCPTool {
  name: string;                  // Tool identifier (e.g., "add_task")
  description: string;           // Human-readable description
  inputSchema: JSONSchema;       // JSON Schema for input validation
}

interface JSONSchema {
  type: "object";
  properties: Record<string, PropertySchema>;
  required?: string[];
}

interface PropertySchema {
  type: "string" | "number" | "boolean";
  description: string;
  enum?: string[];               // For constrained values
}
```

---

### MCPToolInvocation

Represents a single MCP tool call.

```typescript
interface MCPToolInvocation {
  id: string;                    // Unique invocation ID
  toolName: string;              // Name of tool being called
  arguments: Record<string, unknown>; // Input parameters
  timestamp: Date;               // When invocation started
  duration?: number;             // Execution time in ms
  result?: MCPToolResult;        // Result after execution
}

interface MCPToolResult {
  success: boolean;
  content?: unknown;             // Tool-specific result data
  error?: {
    code: string;
    message: string;
  };
}
```

---

### MCP JSON-RPC Types

```typescript
// JSON-RPC Request
interface MCPRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: "tools/list" | "tools/call";
  params?: {
    name?: string;               // Tool name for tools/call
    arguments?: Record<string, unknown>;
  };
}

// JSON-RPC Response
interface MCPResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
```

---

### MCP Tool Input Schemas

```typescript
// add_task tool
interface AddTaskInput {
  title: string;                 // Required
  description?: string;
  due_date?: string;             // ISO date
}

// list_tasks tool
interface ListTasksInput {
  status_filter?: "pending" | "completed" | "all";
}

// update_task tool
interface UpdateTaskInput {
  task_id: number;               // Required
  title?: string;
  description?: string;
}

// complete_task tool
interface CompleteTaskInput {
  task_id: number;               // Required
}

// delete_task tool
interface DeleteTaskInput {
  task_id: number;               // Required
}

// set_due_date tool
interface SetDueDateInput {
  task_id: number;               // Required
  due_date: string;              // Required, ISO date
}
```

---

### MCPContext

Context passed to MCP tool handlers.

```typescript
interface MCPContext {
  userId: string;                // Authenticated user ID
  jwtToken: string;              // JWT for backend auth
  backendUrl: string;            // Phase II API URL
}

---

## Core Entities

### ChatMessage

Represents a single message in the conversation.

```typescript
interface ChatMessage {
  id: string;                    // UUID generated client-side
  sender: 'user' | 'assistant';  // Who sent the message
  content: string;               // Message text content
  timestamp: Date;               // When message was created
  status?: 'sending' | 'sent' | 'error'; // For user messages
}
```

**Validation Rules**:
- `id`: Required, valid UUID v4
- `content`: Required, 1-1000 characters
- `timestamp`: Required, valid Date

---

### ChatIntent

Represents the parsed intent from user message.

```typescript
type IntentType =
  | 'add_task'
  | 'list_tasks'
  | 'update_task'
  | 'complete_task'
  | 'delete_task'
  | 'set_due_date'
  | 'get_task_dates'
  | 'unknown';

interface IntentEntities {
  task_id: number | null;        // Extracted task ID (e.g., "task 5" → 5)
  title: string | null;          // Task title for add/update
  description: string | null;    // Task description for add/update
  status_filter: 'pending' | 'completed' | 'all' | null; // For list_tasks
  due_date: string | null;       // ISO date string for due date operations
}

interface ChatIntent {
  intent: IntentType;            // Classified intent type
  entities: IntentEntities;      // Extracted entities
  confidence: number;            // 0.0 to 1.0 confidence score
  raw_message: string;           // Original user message
}
```

**Validation Rules**:
- `intent`: Required, must be valid IntentType
- `confidence`: Required, 0.0 ≤ value ≤ 1.0
- `task_id`: If present, must be positive integer
- `due_date`: If present, must be valid ISO 8601 date string

---

### ChatSession

Represents the current chat window state.

```typescript
interface ChatSession {
  isOpen: boolean;               // Whether chat window is visible
  isMinimized: boolean;          // Whether minimized to bubble
  messages: ChatMessage[];       // Session message history
  isLoading: boolean;            // Whether waiting for response
  error: ChatError | null;       // Current error state
  cooldownUntil: number | null;  // Unix timestamp for rate limit cooldown
}
```

**State Transitions**:

```
[Closed] --click bubble--> [Open]
[Open] --click minimize--> [Minimized]
[Minimized] --click bubble--> [Open]
[Open] --click close/Escape--> [Closed]
[Open] --send message--> [Loading]
[Loading] --response received--> [Open]
[Loading] --error--> [Open with error]
[Open with error] --clear/new message--> [Open]
```

---

### ChatError

Represents error states in the chatbot.

```typescript
type ChatErrorType =
  | 'network'           // Failed to reach server
  | 'rate_limit'        // Cohere API rate limited
  | 'llm_unavailable'   // Cohere API error
  | 'backend_error'     // Phase II API error
  | 'auth_expired'      // JWT expired
  | 'intent_unclear'    // Could not determine intent
  | 'task_not_found'    // Referenced task doesn't exist
  | 'timeout';          // Request took too long

interface ChatError {
  type: ChatErrorType;
  message: string;      // User-friendly error message
  retryable: boolean;   // Whether user can retry
  retryAfter?: number;  // Seconds until retry allowed (for rate_limit)
}
```

**Error Mapping**:

| HTTP Status | Error Type | Retryable |
|-------------|------------|-----------|
| Network failure | network | Yes |
| 401 | auth_expired | No (redirect) |
| 404 | task_not_found | No |
| 429 | rate_limit | Yes (after cooldown) |
| 500+ (Cohere) | llm_unavailable | Yes |
| 500+ (Backend) | backend_error | Yes |
| Timeout | timeout | Yes |

---

## Agent Types

### AgentContext

Shared context passed to all agents.

```typescript
interface AgentContext {
  userId: string;        // Authenticated user ID
  jwt: string;           // JWT token for backend calls
  message: string;       // Current user message
  backendUrl: string;    // Phase II API base URL
}
```

---

### AgentResult

Standard result type for agent responses.

```typescript
interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

### IntentAnalyzerOutput

Output from intent-analyzer agent.

```typescript
interface IntentAnalyzerOutput {
  intent: ChatIntent;
}
```

---

### ToolExecutorOutput

Output from mcp-tool-executor agent.

```typescript
interface ToolExecutorOutput {
  action: string;              // What action was performed
  result: TaskOperationResult; // API response data
}

interface TaskOperationResult {
  tasks?: Task[];              // For list operations
  task?: Task;                 // For single task operations
  deleted?: boolean;           // For delete operations
  message?: string;            // Additional context
}

// Task type from Phase II backend
interface Task {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;          // ISO date
  updated_at: string;          // ISO date
  due_date: string | null;     // ISO date
  completed_at: string | null; // ISO date
}
```

---

### ResponseComposerOutput

Output from response-composer agent.

```typescript
interface ResponseComposerOutput {
  response: string;            // User-friendly response text
  suggestedActions?: string[]; // Optional follow-up suggestions
}
```

---

### OrchestratorOutput

Final output from todo-orchestrator.

```typescript
interface OrchestratorOutput {
  response: string;            // Final response to show user
  intent?: ChatIntent;         // Detected intent (for debugging)
  error?: ChatError;           // Error if operation failed
}
```

---

## API Request/Response Types

### Chat API Request

```typescript
interface ChatRequest {
  message: string;             // User's message (1-1000 chars)
  userId: string;              // Authenticated user ID
}
```

**Validation**:
- `message`: Required, 1-1000 characters, trimmed
- `userId`: Required, valid user ID format

---

### Chat API Response

```typescript
interface ChatResponse {
  success: boolean;
  response?: string;           // AI response text
  error?: {
    type: ChatErrorType;
    message: string;
    retryable: boolean;
    retryAfter?: number;
  };
}
```

---

## Cohere API Types

### Cohere Chat Request

```typescript
interface CohereChatRequest {
  model: string;               // "command-r-plus" or "command-r"
  message: string;             // User message
  preamble?: string;           // System prompt
  temperature?: number;        // 0.0-1.0
  max_tokens?: number;         // Max response tokens
}
```

---

### Cohere Chat Response

```typescript
interface CohereChatResponse {
  text: string;                // Generated response
  generation_id: string;       // Unique generation ID
  finish_reason: string;       // "COMPLETE" | "MAX_TOKENS" | etc.
}

interface CohereErrorResponse {
  message: string;
  status_code?: number;
}
```

---

## Constants

```typescript
// Intent confidence threshold
const MIN_CONFIDENCE_THRESHOLD = 0.7;

// Rate limit cooldown (seconds)
const RATE_LIMIT_COOLDOWN_SECONDS = 30;

// Request timeout (milliseconds)
const REQUEST_TIMEOUT_MS = 10000;

// Max message length
const MAX_MESSAGE_LENGTH = 1000;

// Max tasks to display at once
const MAX_TASKS_DISPLAY = 10;

// Temperature settings
const INTENT_ANALYZER_TEMPERATURE = 0.3;
const RESPONSE_COMPOSER_TEMPERATURE = 0.7;

// Cohere model
const COHERE_MODEL = 'command-r-plus';
```

---

## Type Exports

```typescript
// index.ts barrel export
export type {
  // Core entities
  ChatMessage,
  ChatIntent,
  IntentType,
  IntentEntities,
  ChatSession,
  ChatError,
  ChatErrorType,

  // Agent types
  AgentContext,
  AgentResult,
  IntentAnalyzerOutput,
  ToolExecutorOutput,
  TaskOperationResult,
  Task,
  ResponseComposerOutput,
  OrchestratorOutput,

  // API types
  ChatRequest,
  ChatResponse,

  // Cohere types
  CohereChatRequest,
  CohereChatResponse,
  CohereErrorResponse,
};

export {
  MIN_CONFIDENCE_THRESHOLD,
  RATE_LIMIT_COOLDOWN_SECONDS,
  REQUEST_TIMEOUT_MS,
  MAX_MESSAGE_LENGTH,
  MAX_TASKS_DISPLAY,
  INTENT_ANALYZER_TEMPERATURE,
  RESPONSE_COMPOSER_TEMPERATURE,
  COHERE_MODEL,
};
```
