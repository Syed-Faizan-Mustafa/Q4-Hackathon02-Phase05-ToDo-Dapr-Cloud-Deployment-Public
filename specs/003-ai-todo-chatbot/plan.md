# Implementation Plan: AI Todo Chatbot

**Branch**: `003-ai-todo-chatbot` | **Date**: 2026-02-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ai-todo-chatbot/spec.md`

## Summary

Build a floating AI chatbot widget integrated into the existing Next.js frontend that enables natural language task management. The chatbot uses a multi-agent architecture (todo-orchestrator → intent-analyzer → mcp-tool-executor → response-composer) powered by Cohere API through OpenAI Agent SDK adapter patterns. All task operations route through the existing Phase II FastAPI backend via REST API with JWT authentication.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend), Python 3.11+ (Agent Logic)
**Primary Dependencies**: Next.js 14+, OpenAI Agent SDK patterns, Cohere API, TailwindCSS
**Storage**: N/A (stateless - all data via Phase II backend API)
**Testing**: Jest (frontend components), Vitest (API routes), manual E2E testing
**Target Platform**: Web (Vercel deployment), responsive 320px-1920px
**Project Type**: Web application (frontend extension to existing monorepo)
**Performance Goals**: <3s response for simple ops, <5s for complex ops, 95% intent accuracy
**Constraints**: Cohere API rate limits, 10s timeout, serverless-compatible, no native deps
**Scale/Scope**: Single user concurrent sessions, 100+ tasks per user supported

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Monorepo Architecture** | PASS | Chatbot integrates into existing `frontend/` directory |
| **II. JWT-Based Authentication** | PASS | All backend calls use existing Better Auth JWT |
| **III. User Data Isolation** | PASS | Chatbot uses user's JWT, enforces {user_id} in API paths |
| **IV. RESTful API Design** | PASS | Uses existing Phase II REST endpoints |
| **V. Test-First Development** | PASS | Unit tests for components, integration tests for API routes |
| **VI. Environment-Based Configuration** | PASS | COHERE_API_KEY, BACKEND_API_URL in .env.local |
| **VII. Phase II Backend Integration** | PASS | All CRUD via Phase II FastAPI, no direct DB access |
| **VIII. Multi-Agent Architecture** | PASS | 4-agent delegation chain implemented |
| **IX. Cohere API as LLM Provider** | PASS | Cohere command-r-plus exclusive, no OpenAI calls |
| **X. OpenAI Agent SDK with Cohere Adapter** | PASS | Custom adapter wrapping Cohere for SDK patterns |
| **XI. Intent Classification Standards** | PASS | All 7 intents implemented with entity extraction |
| **XII. Conversational Interface Standards** | PASS | Friendly responses, no jargon, explicit confirmations |

**Gate Result**: PASS - All constitution principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-todo-chatbot/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entities and types
├── quickstart.md        # Phase 1 output - developer setup guide
├── contracts/           # Phase 1 output - API contracts
│   └── chatbot-api.md   # Chat endpoint contract
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint (serverless)
│   └── layout.tsx                # Add ChatWidget to layout
├── components/
│   └── chat/
│       ├── ChatWidget.tsx        # Main floating widget container
│       ├── ChatBubble.tsx        # Floating chat icon button
│       ├── ChatWindow.tsx        # Chat window with header/messages/input
│       ├── ChatMessage.tsx       # Individual message bubble component
│       ├── ChatInput.tsx         # Message input with send button
│       ├── TypingIndicator.tsx   # Animated typing dots
│       └── index.ts              # Barrel export
├── hooks/
│   └── useChat.ts                # Chat state management hook
├── lib/
│   └── agents/
│       ├── cohere-adapter.ts     # Cohere API wrapper for Agent SDK
│       ├── orchestrator.ts       # todo-orchestrator agent
│       ├── intent-analyzer.ts    # intent-analyzer agent
│       ├── tool-executor.ts      # mcp-tool-executor agent
│       ├── response-composer.ts  # response-composer agent
│       └── types.ts              # Shared agent types
└── __tests__/
    └── chat/
        ├── ChatWidget.test.tsx   # Component tests
        ├── useChat.test.ts       # Hook tests
        └── agents.test.ts        # Agent logic tests
```

**Structure Decision**: Extends existing frontend/ web application structure. All chatbot code lives within frontend/ to maintain monorepo pattern. Agent logic in `lib/agents/` for serverless API route usage.

## Architecture Sketch

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                               │
│  │ ChatWidget   │ ◄─── Floating UI (bottom-right)               │
│  │  ├─ Bubble   │      - 60x60px chat icon                      │
│  │  └─ Window   │      - 400x500px window (desktop)             │
│  │     ├─ Header│      - Full-width (mobile)                    │
│  │     ├─ Messages                                              │
│  │     └─ Input │                                               │
│  └──────────────┘                                               │
│         │                                                        │
│         │ POST /api/chat { message, userId }                    │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────┤
│  │                    API Route (Serverless)                     │
│  │  ┌─────────────────┐                                         │
│  │  │ todo-orchestrator│ ◄─── Entry point                       │
│  │  └────────┬────────┘                                         │
│  │           │                                                   │
│  │           ▼                                                   │
│  │  ┌─────────────────┐    ┌──────────────┐                     │
│  │  │ intent-analyzer │───►│ Cohere API   │ (temp: 0.3)         │
│  │  └────────┬────────┘    │ command-r-plus│                    │
│  │           │              └──────────────┘                     │
│  │           ▼                                                   │
│  │  ┌─────────────────┐    ┌──────────────┐                     │
│  │  │mcp-tool-executor│───►│ Phase II API │                     │
│  │  └────────┬────────┘    │ (FastAPI)    │                     │
│  │           │              └──────────────┘                     │
│  │           ▼                                                   │
│  │  ┌─────────────────┐    ┌──────────────┐                     │
│  │  │response-composer│───►│ Cohere API   │ (temp: 0.7)         │
│  │  └────────┬────────┘    └──────────────┘                     │
│  │           │                                                   │
│  │           ▼                                                   │
│  │      { response: "I've added..." }                           │
│  └──────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE II BACKEND (FastAPI)                     │
│  GET/POST /api/{user_id}/tasks                                  │
│  PUT/DELETE /api/{user_id}/tasks/{id}                           │
│  JWT Authentication Required                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Decisions Needing Documentation

| Decision | Options Considered | Choice | Tradeoffs |
|----------|-------------------|--------|-----------|
| **Agent execution location** | 1) Browser-side 2) Server-side API route | Server-side API route | Protects API keys, consistent environment, but adds latency |
| **State management** | 1) React Context 2) Zustand 3) useState hook | Custom useState hook | Simple, no extra deps, fits session-only requirement |
| **Cohere SDK integration** | 1) Direct REST 2) Official SDK 3) Custom adapter | Custom adapter over REST | Full control, SDK patterns, Vercel compatible |
| **Chat UI framework** | 1) Headless UI 2) Custom components 3) Chat UI library | Custom TailwindCSS components | No extra deps, full control, matches existing styles |
| **Animation library** | 1) Framer Motion 2) CSS transitions 3) React Spring | CSS transitions | Zero bundle impact, sufficient for slide/fade |

## Testing Strategy

### Unit Tests (Jest/Vitest)

| Component | Test Cases |
|-----------|------------|
| `ChatBubble` | Renders icon, click opens window, ARIA labels present |
| `ChatWindow` | Opens/closes, escape key closes, mobile responsive |
| `ChatMessage` | User/assistant styling, timestamp display |
| `ChatInput` | Enter sends, button sends, empty validation |
| `useChat` | Add message, loading state, error handling |
| `intent-analyzer` | All 7 intents recognized, entity extraction |
| `cohere-adapter` | API calls formatted correctly, errors handled |

### Integration Tests

| Flow | Validation |
|------|------------|
| Add task flow | User message → Intent → API call → Response |
| List tasks flow | Filter params extracted, pagination works |
| Error handling | Backend unavailable → friendly message |
| Rate limiting | Cooldown enforced, retry works |

### Acceptance Criteria Validation

| SC-ID | Criteria | Test Method |
|-------|----------|-------------|
| SC-001 | Open + send within 5s | Manual timing test |
| SC-002 | 95% intent accuracy | Test suite with 50+ samples |
| SC-003 | <3s simple operations | API response timing |
| SC-004 | <5s complex operations | API response timing |
| SC-005 | Zero unauthorized access | Security test with wrong user_id |
| SC-006 | 90% first-attempt success | Usability test |
| SC-007 | 320px-1920px responsive | Visual regression tests |
| SC-008 | <100ms UI response | Performance profiling |
| SC-009 | Feedback for every action | E2E test coverage |
| SC-010 | Clean Vercel deployment | CI/CD pipeline |

## Quality Validation

### Pre-Implementation Checklist

- [x] All constitution principles addressed
- [x] No NEEDS CLARIFICATION markers remain
- [x] Architecture supports all 7 user stories
- [x] Error handling for all edge cases defined
- [x] Performance targets achievable with chosen stack
- [x] Vercel deployment constraints addressed

### Post-Implementation Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Accessibility audit passed (ARIA, keyboard nav)
- [ ] Mobile responsive verified
- [ ] Vercel build successful
- [ ] Production deployment tested

## Implementation Phases

### Phase 1: Research (Complete via research.md)

- Cohere API integration patterns
- OpenAI Agent SDK adapter approach
- Vercel serverless constraints
- Intent classification prompt engineering

### Phase 2: Foundation

- Chat UI components (ChatWidget, ChatBubble, ChatWindow, ChatMessage, ChatInput)
- useChat hook with message state
- Basic open/close/minimize functionality
- Styling with TailwindCSS

### Phase 3: Agent Layer

- Cohere adapter implementation
- Intent analyzer with prompt template
- Tool executor with backend API calls
- Response composer with friendly templates
- Orchestrator tying all agents together

### Phase 4: Integration & Polish

- Wire UI to API route
- Add typing indicator
- Implement welcome message
- Error handling and retry logic
- Accessibility improvements
- Mobile optimization

### Phase 5: Testing & Deployment

- Unit tests for all components
- Integration tests for agent flows
- Vercel deployment configuration
- Production smoke testing

## Complexity Tracking

> No constitution violations requiring justification. Design follows all principles.

| Aspect | Complexity Level | Justification |
|--------|-----------------|---------------|
| Multi-agent architecture | Medium | Required by constitution VIII |
| Custom Cohere adapter | Medium | Required by constitution X |
| Serverless constraints | Low | Standard Next.js patterns |
| UI components | Low | Standard React patterns |

---

**Next Step**: Run `/sp.tasks` to generate actionable task breakdown
