# Implementation Plan: AI Todo Chatbot with MCP Server

**Branch**: `003-ai-todo-chatbot` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ai-todo-chatbot/spec.md`

## Summary

AI Todo Chatbot with MCP (Model Context Protocol) Server integration enabling natural language task management. The chatbot uses a multi-agent architecture (Orchestrator → Intent Analyzer → MCP Tool Executor → Response Composer) with Cohere API for LLM inference. MCP Server exposes task CRUD operations as tools that communicate with the existing Phase II FastAPI backend.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend/MCP), Python 3.11 (Backend reference)
**Primary Dependencies**:
- `@modelcontextprotocol/sdk` - Official MCP SDK for tool definitions
- `cohere-ai` - Cohere API client for LLM inference
- `Next.js 14` - Existing frontend framework
- `React 18` - UI components
**Storage**: N/A (uses Phase II PostgreSQL via REST API)
**Testing**: Jest, React Testing Library, Playwright (E2E)
**Target Platform**: Web (Vercel deployment), Node.js 18+
**Project Type**: Web application (existing monorepo structure)
**Performance Goals**:
- Intent recognition: <1 second
- MCP tool execution: <2 seconds
- Full response cycle: <3-5 seconds
**Constraints**:
- 10 second timeout for complete response
- 1000 character message limit
- Session-only conversation state (no persistence)
**Scale/Scope**:
- 6 MCP tools (add, list, update, complete, delete, set_due_date)
- 4 agents (orchestrator, intent-analyzer, mcp-tool-executor, response-composer)
- 7 user stories (P1-P7)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| VII. Phase II Backend Integration | PASS | All operations via MCP Server → Phase II REST API |
| VIII. Multi-Agent Architecture | PASS | 4 agents with strict delegation chain defined |
| IX. Cohere API as LLM Provider | PASS | Using command-r-plus model, temperature settings defined |
| X. OpenAI Agent SDK with Cohere Adapter | PASS | Using MCP SDK patterns with Cohere integration |
| XI. Intent Classification Standards | PASS | 7 intents defined with entity extraction |
| XII. Conversational Interface Standards | PASS | Friendly responses, no hallucination, explicit confirmations |

**Gate Status**: PASSED - All constitution principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-todo-chatbot/
├── plan.md              # This file
├── research.md          # Phase 0 output - MCP SDK research
├── data-model.md        # Phase 1 output - Entity definitions
├── quickstart.md        # Phase 1 output - Setup guide
├── contracts/           # Phase 1 output - MCP tool schemas
│   ├── mcp-tools.json   # MCP tool definitions
│   └── agent-contracts.json  # Agent I/O contracts
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── lib/
│   ├── mcp/                    # MCP Server & Client
│   │   ├── server.ts           # MCP Server with tool registry
│   │   ├── client.ts           # MCP Client for frontend
│   │   ├── tools/              # MCP Tool definitions
│   │   │   ├── add-task.ts
│   │   │   ├── list-tasks.ts
│   │   │   ├── update-task.ts
│   │   │   ├── complete-task.ts
│   │   │   ├── delete-task.ts
│   │   │   └── set-due-date.ts
│   │   └── types.ts            # MCP type definitions
│   ├── agents/                 # Multi-Agent System
│   │   ├── orchestrator.ts     # Entry point agent
│   │   ├── intent-analyzer.ts  # NLU with Cohere
│   │   ├── mcp-tool-executor.ts # MCP tool invocation
│   │   ├── response-composer.ts # Response generation
│   │   ├── cohere-adapter.ts   # Cohere API wrapper
│   │   └── types.ts            # Agent type definitions
│   └── utils/
│       └── backend-client.ts   # Phase II API client
├── components/
│   └── chat/                   # Chat UI components
│       ├── ChatWidget.tsx
│       ├── ChatWindow.tsx
│       ├── ChatBubble.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       └── TypingIndicator.tsx
├── hooks/
│   └── useChat.ts              # Chat state management
├── app/
│   └── api/
│       └── chat/
│           └── route.ts        # Chat API endpoint
└── tests/
    ├── unit/
    │   ├── mcp/
    │   └── agents/
    └── integration/
        └── chat-flow.test.ts
```

**Structure Decision**: Using existing monorepo structure with new `lib/mcp/` directory for MCP Server and updated `lib/agents/` for multi-agent system with MCP integration.

## Complexity Tracking

No constitution violations to justify - all requirements fit within established patterns.
