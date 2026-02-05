---
id: 0005
title: AI Todo Chatbot Implementation (Phase III)
stage: green
date: 2026-02-04
surface: agent
model: claude-opus-4-5-20251101
feature: 003-ai-todo-chatbot
branch: 002-backend-todo-api
user: faizan
command: /sp.implement
labels: ["implementation", "chatbot", "cohere", "multi-agent", "nextjs"]
links:
  spec: specs/003-ai-todo-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/agents/types.ts
  - frontend/lib/agents/cohere-adapter.ts
  - frontend/lib/agents/intent-analyzer.ts
  - frontend/lib/agents/tool-executor.ts
  - frontend/lib/agents/response-composer.ts
  - frontend/lib/agents/orchestrator.ts
  - frontend/lib/agents/index.ts
  - frontend/hooks/useChat.ts
  - frontend/components/chat/ChatBubble.tsx
  - frontend/components/chat/ChatWindow.tsx
  - frontend/components/chat/ChatWidget.tsx
  - frontend/components/chat/ChatMessage.tsx
  - frontend/components/chat/ChatInput.tsx
  - frontend/components/chat/TypingIndicator.tsx
  - frontend/components/chat/AuthenticatedChatWidget.tsx
  - frontend/components/chat/index.ts
  - frontend/app/api/chat/route.ts
  - frontend/app/layout.tsx
  - frontend/.env.example
tests:
  - npm run build (passed)
---

## Prompt

Continue implementing the AI Todo Chatbot feature (Feature 003-ai-todo-chatbot) following the /sp.implement command workflow. This is Phase III of a Todo application, adding a conversational AI interface that integrates with a Phase II FastAPI backend using Cohere API for LLM inference.

## Response snapshot

Completed implementation of 66 out of 67 tasks across 10 phases:

**Phase 1 (Setup):** Created directory structure and shared types file at `frontend/lib/agents/types.ts`

**Phase 2 (Foundational):** Implemented multi-agent architecture:
- `cohere-adapter.ts`: Cohere API REST integration with command-r-plus model, error handling, rate limiting
- `intent-analyzer.ts`: LLM-powered intent analysis with 7 supported intents
- `tool-executor.ts`: Backend API calls for all CRUD operations + due dates
- `response-composer.ts`: User-friendly response generation with templates
- `orchestrator.ts`: Main coordination agent with 10s timeout handling
- `useChat.ts`: React hook for chat state management

**Phase 3-9 (User Stories 1-7):** Implemented full chat UI and all CRUD intents:
- ChatBubble (60x60px floating icon)
- ChatWindow (400x500px with mobile responsive)
- ChatWidget with Escape key handling
- ChatMessage, ChatInput (with 1000 char limit), TypingIndicator
- AuthenticatedChatWidget wrapper for layout integration
- All 7 intents: add_task, list_tasks, update_task, complete_task, delete_task, set_due_date, get_task_dates

**Phase 10 (Polish):** Fixed TypeScript errors with `as const` assertions for literal types, verified build passes.

## Outcome

- Impact: Full AI chatbot feature implemented - users can manage tasks via natural language conversation
- Tests: Build passes successfully (npm run build exit code 0)
- Files: 18 new files created, 1 file modified (layout.tsx)
- Next prompts: T067 - Run production deployment and smoke test all 7 user stories
- Reflection: Multi-agent architecture provides clean separation of concerns. TypeScript strict mode requires careful type narrowing with const assertions.

## Evaluation notes (flywheel)

- Failure modes observed: TypeScript type inference issues with string literals in object spread - required `as const` assertions
- Graders run and results (PASS/FAIL): Build compilation PASS, Type checking PASS
- Prompt variant (if applicable): N/A (implementation phase)
- Next experiment (smallest change to try): Add ESLint to dev dependencies for linting during builds
