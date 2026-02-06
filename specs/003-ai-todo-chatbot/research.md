# Research: AI Todo Chatbot with MCP Server

**Feature**: 003-ai-todo-chatbot
**Date**: 2026-02-03
**Updated**: 2026-02-06
**Status**: Complete (v2 - MCP Server Integration)

## Research Overview

This document captures technology decisions, best practices research, and integration patterns for the AI Todo Chatbot implementation with MCP (Model Context Protocol) Server.

---

## 0. MCP Server Integration (NEW - v2)

### Decision
Use `@modelcontextprotocol/sdk` (TypeScript) for MCP Server implementation as Next.js API route handlers.

### Rationale
- Official SDK from Anthropic/Model Context Protocol
- TypeScript-native, integrates seamlessly with Next.js
- Provides standardized tool definition patterns
- JSON-RPC protocol for structured communication
- Tool abstraction layer for backend operations

### Alternatives Considered
| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Python MCP SDK | Native Python | Separate service needed | Adds deployment complexity |
| Custom REST wrapper | Full control | No MCP benefits | Loses tool abstraction |
| Direct backend calls | Simpler | No MCP protocol | **Was v1** - upgrading to MCP |
| MCP TypeScript SDK | Standard, typed | SDK dependency | **SELECTED** |

### MCP Tool Registry Pattern

```typescript
// lib/mcp/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const mcpServer = new Server(
  { name: "todo-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "add_task",
      description: "Add a new task to the user's todo list",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title (required)" },
          description: { type: "string", description: "Task description (optional)" },
          due_date: { type: "string", description: "ISO date for due date (optional)" },
        },
        required: ["title"],
      },
    },
    // ... other tools
  ],
}));

// Handle tool calls
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case "add_task":
      return await handleAddTask(args);
    // ... other handlers
  }
});
```

### MCP Transport for Next.js

Since Next.js API routes are HTTP-based (not stdio), we'll implement a custom HTTP transport:

```typescript
// app/api/mcp/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // JSON-RPC request handling
  if (body.method === "tools/list") {
    return Response.json({
      jsonrpc: "2.0",
      id: body.id,
      result: await mcpServer.listTools(),
    });
  }

  if (body.method === "tools/call") {
    const result = await mcpServer.callTool(body.params.name, body.params.arguments);
    return Response.json({
      jsonrpc: "2.0",
      id: body.id,
      result,
    });
  }
}
```

### MCP Client Pattern

```typescript
// lib/mcp/client.ts
class MCPClient {
  constructor(private baseUrl: string, private jwtToken: string) {}

  async callTool(name: string, args: Record<string, unknown>) {
    const response = await fetch(`${this.baseUrl}/api/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.jwtToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name, arguments: args },
      }),
    });

    const result = await response.json();
    return result.result;
  }
}
```

---

## 1. Cohere API Integration

### Decision
Use Cohere REST API directly with custom TypeScript wrapper (not official SDK).

### Rationale
- Official Cohere SDK has Node.js dependencies that may conflict with Vercel Edge Runtime
- Direct REST API gives full control over request/response handling
- Easier to implement custom retry logic and rate limit handling
- Smaller bundle size without SDK overhead

### Alternatives Considered
| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Official Cohere SDK | Easy setup, typed | Bundle size, Edge issues | Vercel compatibility concerns |
| LangChain | Many integrations | Heavy, complex | Over-engineered for this use case |
| Direct REST | Full control, small | More code | **SELECTED** |

### Implementation Pattern

```typescript
// cohere-adapter.ts
interface CohereRequest {
  model: string;
  message: string;
  temperature: number;
  max_tokens: number;
}

interface CohereResponse {
  text: string;
  generation_id: string;
}

async function cohereChat(request: CohereRequest): Promise<CohereResponse> {
  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      message: request.message,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
    }),
  });

  if (!response.ok) {
    throw new CohereError(response.status, await response.text());
  }

  return response.json();
}
```

---

## 2. OpenAI Agent SDK Adapter Pattern

### Decision
Implement custom adapter that provides OpenAI Agent SDK-like interface while using Cohere as backend.

### Rationale
- Constitution X requires "OpenAI Agent SDK patterns with Cohere adapter"
- Proven patterns (tools, handoffs, structured output) reduce development time
- Custom adapter allows full Cohere feature access
- Can be replaced with actual SDK if Cohere releases one later

### Alternatives Considered
| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| OpenAI SDK + Cohere | Standard API | Cohere not supported | Constitution IX prohibits OpenAI |
| Custom from scratch | Full control | Reinvent patterns | Unnecessary complexity |
| Adapter pattern | Best of both | Custom code | **SELECTED** |

### Agent Interface Pattern

```typescript
// types.ts
interface AgentContext {
  userId: string;
  message: string;
  jwt: string;
}

interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Agent<TInput, TOutput> {
  name: string;
  execute(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
}
```

---

## 3. Intent Classification Approach

### Decision
Use Cohere chat completion with structured JSON output prompt for intent classification.

### Rationale
- Cohere command-r-plus excels at following instructions
- JSON mode ensures parseable output
- Lower temperature (0.3) provides deterministic results
- Single prompt handles both intent and entity extraction

### Intent Classification Prompt Template

```text
You are an intent classifier for a task management chatbot.
Analyze the user message and extract the intent and entities.

Supported intents:
- add_task: User wants to create a new task
- list_tasks: User wants to see their tasks
- complete_task: User wants to mark a task as done
- update_task: User wants to modify a task
- delete_task: User wants to remove a task
- set_due_date: User wants to set/change a due date
- get_task_dates: User wants to know task dates

User message: "{message}"

Respond with ONLY valid JSON in this format:
{
  "intent": "<intent_name>",
  "entities": {
    "task_id": <number or null>,
    "title": "<string or null>",
    "description": "<string or null>",
    "status_filter": "<pending|completed|all|null>",
    "due_date": "<ISO date or null>"
  },
  "confidence": <0.0 to 1.0>
}
```

### Test Cases for Intent Recognition

| Input | Expected Intent | Expected Entities |
|-------|-----------------|-------------------|
| "Add buy groceries" | add_task | { title: "buy groceries" } |
| "Show my tasks" | list_tasks | { status_filter: "all" } |
| "Mark task 3 done" | complete_task | { task_id: 3 } |
| "What tasks are pending?" | list_tasks | { status_filter: "pending" } |
| "Delete task 5" | delete_task | { task_id: 5 } |
| "Set task 2 due tomorrow" | set_due_date | { task_id: 2, due_date: "..." } |

---

## 4. Vercel Serverless Constraints

### Decision
Use standard Next.js API routes (not Edge Runtime) for chat endpoint.

### Rationale
- Edge Runtime has strict limits (no Node.js APIs, limited execution time)
- Standard API routes support up to 60s execution (plenty for 10s timeout)
- Better error handling and logging capabilities
- Cohere REST API works fine without Edge optimization

### Alternatives Considered
| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Edge Runtime | Fast cold start | Limited APIs, 25s max | Constraints too restrictive |
| Serverless Functions | Full Node.js | Slower cold start | **SELECTED** - acceptable tradeoff |
| External API server | No limits | Extra deployment | Unnecessary complexity |

### Deployment Configuration

```typescript
// app/api/chat/route.ts
export const maxDuration = 30; // 30 seconds max (Vercel Pro default)
export const dynamic = 'force-dynamic'; // No caching
```

---

## 5. Chat UI Component Pattern

### Decision
Build custom React components with TailwindCSS, following existing app patterns.

### Rationale
- Matches existing frontend styling
- No additional dependencies
- Full control over animations and accessibility
- Smaller bundle size than UI libraries

### Component Hierarchy

```
ChatWidget (container)
├── ChatBubble (floating button)
└── ChatWindow (dialog)
    ├── ChatHeader (title, minimize, close)
    ├── ChatMessages (scrollable message list)
    │   └── ChatMessage[] (individual bubbles)
    │       └── TypingIndicator (animated dots)
    └── ChatInput (text input + send button)
```

### Animation Approach

```css
/* CSS transitions for slide-up effect */
.chat-window {
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.chat-window.open {
  transform: translateY(0);
  opacity: 1;
}
```

---

## 6. Error Handling Strategy

### Decision
Implement layered error handling with user-friendly messages at each level.

### Error Categories

| Error Type | Detection | User Message | Recovery |
|------------|-----------|--------------|----------|
| Network error | fetch throws | "Having trouble connecting..." | Retry button |
| Cohere rate limit | 429 status | "AI is busy, try in 30s" | 30s cooldown |
| Cohere unavailable | 5xx status | "AI service unavailable" | Retry button |
| Backend unavailable | 5xx from API | "Server error, try again" | Retry button |
| Invalid intent | Low confidence | "I'm not sure what you mean..." | Suggestions |
| Task not found | 404 from API | "Couldn't find that task" | List tasks |
| Auth expired | 401 from API | "Session expired, please login" | Redirect |

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1,
  delayMs: number = 2000
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError!;
}
```

---

## 7. State Management

### Decision
Use React useState hook with custom useChat hook for session-only state.

### Rationale
- Constitution FR-034 prohibits persisting conversation history
- useState provides simplest session-scoped state
- No external state library needed
- Easy to reset on window close

### useChat Hook Interface

```typescript
interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  cooldownUntil: number | null;
}

interface UseChatReturn {
  state: ChatState;
  sendMessage: (content: string) => Promise<void>;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  clearError: () => void;
}

function useChat(userId: string, jwt: string): UseChatReturn;
```

---

## Research Summary

| Topic | Decision | Confidence |
|-------|----------|------------|
| **MCP Server** | `@modelcontextprotocol/sdk` TypeScript | High |
| **MCP Transport** | HTTP-based JSON-RPC in Next.js API | High |
| Cohere Integration | Direct REST API | High |
| Agent Pattern | Custom SDK adapter + MCP Tool Executor | High |
| Intent Classification | JSON prompt template | High |
| Serverless Runtime | Standard API routes | High |
| UI Components | Custom TailwindCSS | High |
| Error Handling | Layered with retry | High |
| State Management | useState hook | High |

**v2 Update (2026-02-06)**: Added MCP Server integration with 6 tools (add_task, list_tasks, update_task, complete_task, delete_task, set_due_date). Agent architecture updated to include `mcp-tool-executor` agent.

All NEEDS CLARIFICATION items resolved. Ready for Phase 1 design.
