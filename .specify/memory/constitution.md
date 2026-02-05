<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version Change: 1.0.0 → 2.0.0 (MAJOR - Phase III AI Chatbot Integration)

Modified Principles:
- Technology Stack expanded for AI Chatbot layer
- Environment Configuration expanded for Cohere API

Added Sections:
- Phase III: AI Todo Chatbot Principles (Principles VII-XII)
- AI Chatbot Technology Stack
- Multi-Agent Architecture section
- Intent Classification Standards
- Cohere API Integration Standards

Removed Sections: None

Templates Requiring Updates:
- ✅ plan-template.md - Constitution Check section references principles (compatible)
- ✅ spec-template.md - Requirements align with FR/NFR patterns (compatible)
- ✅ tasks-template.md - Phase structure aligns with constitution (compatible)
- 🆕 Agent definitions in .claude/agents/ align with constitution

Follow-up TODOs:
- Create Phase III spec document for AI Chatbot
- Implement Cohere adapter for Agent SDK

================================================================================
-->

# Todo Full-Stack Web Application Constitution

## Phase II: Core Principles

### I. Monorepo Architecture

The project MUST follow a monorepo structure with clear separation between frontend and backend concerns:
- Frontend (Next.js) and Backend (FastAPI) reside in the same repository
- Each component MUST be independently buildable and testable
- Shared configuration (environment variables, secrets) MUST be centralized
- Cross-component dependencies MUST be explicitly documented

**Rationale**: A monorepo simplifies deployment coordination, ensures version consistency, and enables atomic changes across the full stack while maintaining clear boundaries.

### II. JWT-Based Authentication

All API communication MUST be secured via JWT tokens issued by Better Auth:
- Frontend authenticates users and obtains JWT tokens from Better Auth
- Every API request MUST include `Authorization: Bearer <token>` header
- Backend MUST verify tokens using the shared `BETTER_AUTH_SECRET`
- Tokens MUST have configurable expiry (default: 7 days)
- Requests without valid tokens MUST receive 401 Unauthorized

**Rationale**: Stateless JWT authentication enables independent frontend/backend scaling without shared session state while maintaining security through cryptographic verification.

### III. User Data Isolation

Users MUST only access their own data - this is NON-NEGOTIABLE:
- All task endpoints MUST include `{user_id}` in the path
- Backend MUST extract `user_id` from verified JWT and validate against path
- Database queries MUST filter by authenticated user's ID
- Any attempt to access another user's data MUST return 403 Forbidden

**Rationale**: Multi-tenant data isolation prevents data leakage and ensures privacy compliance. Path-based user identification combined with JWT verification provides defense in depth.

### IV. RESTful API Design

The API MUST follow REST conventions with predictable endpoint patterns:
- Resource-based URLs: `/api/{user_id}/tasks` and `/api/{user_id}/tasks/{id}`
- Standard HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove), PATCH (partial update)
- Consistent response formats with appropriate HTTP status codes
- All endpoints MUST be documented with request/response schemas

**Rationale**: RESTful design ensures API predictability, enables client code generation, and follows industry-standard patterns for maintainability.

### V. Test-First Development

Testing MUST accompany all feature development:
- Unit tests for business logic and validation
- Integration tests for API endpoints
- Contract tests for frontend-backend communication
- Security tests for authentication and authorization flows

**Rationale**: Comprehensive testing prevents regressions, documents expected behavior, and enables confident refactoring and deployment.

### VI. Environment-Based Configuration

All secrets and environment-specific values MUST be externalized:
- `BETTER_AUTH_SECRET` MUST be identical on frontend and backend
- Database connection strings MUST use environment variables
- No hardcoded secrets, tokens, or credentials in source code
- `.env.example` MUST document all required variables without values

**Rationale**: Environment-based configuration enables secure secret management, simplifies deployment across environments, and prevents accidental credential exposure.

---

## Phase III: AI Todo Chatbot Principles

### VII. Phase II Backend Integration (NON-NEGOTIABLE)

The AI Chatbot MUST integrate exclusively with the existing Phase II FastAPI backend:
- All task operations (CRUD) MUST route through Phase II REST API endpoints
- Backend URL: `BACKEND_API_URL` environment variable (deployed: https://syedfaizanmustafa-q4-hackathon-02-phase-ii.hf.space)
- NO direct database access from chatbot - all data via backend API only
- JWT authentication MUST be maintained for all backend calls
- Chatbot acts as an intelligent interface layer, NOT a data layer

**Rationale**: Maintaining single source of truth for data operations ensures consistency, leverages existing security controls, and prevents data synchronization issues.

### VIII. Multi-Agent Architecture

The chatbot MUST follow a strict multi-agent orchestration pattern:
- **Orchestrator-First**: `todo-orchestrator` is the ONLY entry point for all chat requests
- **Strict Delegation Chain**: Orchestrator → Intent Analyzer → MCP Tool Executor → Response Composer
- **Stateless Agents**: Agents MUST NOT store in-memory conversation state
- **Structured Communication**: Agent outputs MUST be structured JSON for inter-agent communication
- **Single Responsibility**: Each agent has ONE specific responsibility

**Agent Responsibilities**:
| Agent | Responsibility | Input | Output |
|-------|---------------|-------|--------|
| `todo-orchestrator` | Entry point, delegation, assembly | User message | Final JSON response |
| `intent-analyzer` | Parse intent, extract entities | Natural language | Structured intent JSON |
| `mcp-tool-executor` | Execute backend API calls | Intent + entities | Raw API results |
| `response-composer` | Generate user-friendly response | Tool results | Plain text message |

**Rationale**: Multi-agent architecture enables specialization, testability, and maintainability while preventing monolithic complexity.

### IX. Cohere API as LLM Provider

All LLM inference MUST use Cohere API exclusively:
- API Key: `COHERE_API_KEY` environment variable
- Model: `command-r-plus` (primary) or `command-r` (cost optimization)
- NO OpenAI API calls - Cohere is the exclusive LLM provider
- Rate limits MUST be respected (Cohere API limits)
- API Base URL: `https://api.cohere.ai/v1`

**Temperature Settings**:
| Agent Type | Temperature | Rationale |
|------------|-------------|-----------|
| Intent Analysis | 0.3 | Deterministic, accurate parsing |
| Response Composition | 0.7 | Natural, friendly responses |

**Rationale**: Single LLM provider simplifies integration, cost tracking, and ensures consistent behavior across agents.

### X. OpenAI Agent SDK with Cohere Adapter

Agent orchestration MUST use OpenAI Agent SDK patterns with Cohere adapter:
- Use `openai-agents` SDK structure for agent orchestration
- Implement custom Cohere adapter/wrapper for SDK compatibility
- Maintain SDK patterns: tools, handoffs, guardrails
- Structured output patterns MUST be preserved
- Custom model provider implementation for Cohere integration

**Rationale**: Leveraging proven SDK patterns reduces development time while Cohere adapter enables preferred LLM provider usage.

### XI. Intent Classification Standards

The chatbot MUST support the following task management intents:

| Intent | Description | Required Entities |
|--------|-------------|-------------------|
| `add_task` | Create new task | `title` (required), `description` (optional), `due_date` (optional) |
| `list_tasks` | View tasks | `status_filter` (optional: pending/completed/all) |
| `update_task` | Modify task | `task_id` (required), fields to update |
| `complete_task` | Mark complete | `task_id` (required), `completed_date` (auto-set) |
| `delete_task` | Remove task | `task_id` (required) |
| `set_due_date` | Set/update due date | `task_id` (required), `due_date` (required) |
| `get_task_dates` | Query task dates | `task_id` (optional), `date_type` (created/due/completed) |

**Intent Output Format**:
```json
{
  "intent": "add_task | list_tasks | update_task | complete_task | delete_task | set_due_date | get_task_dates",
  "entities": {
    "task_id": "<integer or null>",
    "title": "<string or null>",
    "description": "<string or null>",
    "status_filter": "<pending | completed | all | null>",
    "due_date": "<ISO date string or null>",
    "completed_date": "<ISO date string or null>"
  },
  "confidence": "<float 0-1>"
}
```

**Rationale**: Explicit intent definitions enable accurate classification, proper entity extraction, and clear backend API mapping.

### XII. Conversational Interface Standards

User-facing responses MUST follow these standards:
- Natural language input processing (no special commands required)
- Friendly, confirming response generation
- Graceful error handling with helpful suggestions
- NO technical jargon in user responses
- NO hallucination - only confirmed data from backend
- Explicit action confirmation (what was done)

**Response Examples**:
- Success: "I've added 'Buy groceries' to your task list."
- Error: "I couldn't find that task. Would you like to see your current tasks?"
- Clarification: "I'm not sure which task you mean. Could you specify the task name or ID?"

**Rationale**: User-friendly communication ensures positive user experience and builds trust in the AI assistant.

---

## Technology Stack

### Phase II Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (React) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Neon Serverless) |
| Authentication | Better Auth (JWT) |
| API Protocol | REST over HTTPS |

### Phase III Stack (AI Chatbot)

| Layer | Technology |
|-------|------------|
| LLM Provider | Cohere API (command-r-plus) |
| Agent Framework | OpenAI Agent SDK (with Cohere adapter) |
| Backend Integration | Phase II FastAPI REST API |
| Runtime | Python 3.11+ |

**Constraints**:
- Python version: 3.11+
- Node.js version: 18+
- PostgreSQL version: 14+
- Cohere API: Latest stable version

---

## Environment Variables

### Required Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `COHERE_API_KEY` | `.env.local` | Cohere API authentication |
| `COHERE_MODEL` | `.env.local` | Model selection (command-r-plus/command-r) |
| `BACKEND_API_URL` | `.env.local` | Phase II backend base URL |
| `BETTER_AUTH_SECRET` | `.env.local` | JWT verification (shared) |
| `AGENT_INTENT_TEMPERATURE` | `.env.local` | Intent analyzer temperature |
| `AGENT_RESPONSE_TEMPERATURE` | `.env.local` | Response composer temperature |
| `AGENT_MAX_TOKENS` | `.env.local` | Max tokens per agent response |

### File Locations

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Template with variable names (no values) | Committed |
| `.env.local` | Actual credentials | **GITIGNORED** |
| `backend/.env` | Backend-specific config | **GITIGNORED** |
| `frontend/.env` | Frontend-specific config | **GITIGNORED** |

---

## Security Requirements

### Authentication Flow (Phase II)

1. User logs in on Frontend via Better Auth
2. Better Auth issues JWT token with user claims
3. Frontend stores token securely and attaches to all API requests
4. Backend middleware verifies JWT signature using shared secret
5. Backend extracts `user_id` from token claims
6. Backend enforces `user_id` matches path parameter

### AI Chatbot Security (Phase III)

1. Chatbot receives authenticated user context (user_id from JWT)
2. All backend API calls include user's JWT token
3. Chatbot NEVER stores or logs sensitive user data
4. Cohere API calls do NOT include PII in prompts
5. Rate limiting applies to chatbot endpoints

### Security Controls

- **Token Verification**: All endpoints require valid JWT (except health checks)
- **Path Authorization**: `user_id` in path MUST match token's `user_id`
- **Input Validation**: All inputs MUST be validated against schemas
- **Error Handling**: Error responses MUST NOT leak internal details
- **CORS**: Configure allowed origins explicitly for production
- **Rate Limiting**: Implement rate limiting on authentication endpoints
- **API Key Protection**: Cohere API key MUST be server-side only, never exposed to client

---

## Governance

This constitution defines non-negotiable principles for the Todo Full-Stack Web Application. All development work MUST comply with these principles.

**Amendment Process**:
1. Proposed amendments MUST be documented with rationale
2. Amendments MUST be reviewed for security and architectural impact
3. Breaking changes require migration plan and version bump
4. All amendments MUST be recorded with date and description

**Compliance**:
- All pull requests MUST verify compliance with constitution principles
- Code reviews MUST check for security requirement adherence
- Deviations require explicit justification and approval

**Guidance**: See `CLAUDE.md` for runtime development guidance and tooling.

---

## Success Criteria

### Phase III AI Chatbot

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Intent Recognition Accuracy | > 95% | Test suite validation |
| Response Time (simple ops) | < 3 seconds | End-to-end latency |
| Unauthorized Data Access | 0 incidents | Security audit |
| User Satisfaction | > 4/5 rating | User feedback |
| API Error Handling | 100% graceful | No unhandled exceptions |

---

**Version**: 2.0.0 | **Ratified**: 2026-01-09 | **Last Amended**: 2026-02-03

**Changelog**:
- v1.0.0 (2026-01-09): Initial constitution with Phase II principles
- v2.0.0 (2026-02-03): Added Phase III AI Chatbot principles (VII-XII), Cohere integration, multi-agent architecture
