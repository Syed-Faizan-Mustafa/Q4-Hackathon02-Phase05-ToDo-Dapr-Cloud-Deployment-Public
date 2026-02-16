<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version Change: 2.0.0 → 3.0.0 (MAJOR - Phase IV Containerization + Phase V Advanced Cloud)

Modified Principles:
- Technology Stack expanded for Kafka, Dapr, Microservices, K8s, CI/CD, Monitoring
- Environment Configuration expanded for Dapr, Kafka, Cloud providers
- Security Requirements expanded for Dapr secrets, K8s RBAC, inter-service auth
- Intent Classification expanded with new intents (recurring, priority, tags, search)

Added Sections:
- Phase IV: Containerization & Local Deployment (Principle XIII)
- Phase V: Advanced Cloud Deployment (Principles XIV-XX)
  - XIV. Event-Driven Architecture (Kafka)
  - XV. Dapr Integration
  - XVI. Microservices Architecture
  - XVII. Advanced Task Features
  - XVIII. Cloud-Native Deployment
  - XIX. CI/CD Pipeline
  - XX. Monitoring & Observability
- Phase IV & V Technology Stacks
- Phase V Environment Variables
- Phase V Success Criteria

Removed Sections: None

Templates Requiring Updates:
- ✅ plan-template.md - Constitution Check section references principles (compatible)
- ✅ spec-template.md - Requirements align with FR/NFR patterns (compatible)
- ✅ tasks-template.md - Phase structure aligns with constitution (compatible)
- 🆕 7 new agent definitions in .claude/agents/ align with Phase V principles
- 🆕 7 new skill definitions in .claude/skills/ align with Phase V principles

Follow-up TODOs:
- Create Part A spec for Advanced Features + Kafka + Dapr
- Create Part B spec for Minikube + Dapr local deployment
- Create Part C spec for Cloud + CI/CD + Monitoring

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

## Phase IV: Containerization & Local Deployment

### XIII. Container-First Architecture

All services MUST be containerized and deployable via Kubernetes:
- Every service (frontend, backend) MUST have a production-ready Dockerfile
- Multi-stage Docker builds MUST be used for minimal image size
- Helm charts MUST manage all Kubernetes resources
- Local development MUST be supported via Minikube
- `imagePullPolicy: Never` for Minikube (local images), `Always` for cloud

**Deployment Artifacts**:
| Artifact | Location | Purpose |
|----------|----------|---------|
| `frontend/Dockerfile` | Frontend container | Next.js production build |
| `backend/Dockerfile` | Backend container | FastAPI + Uvicorn |
| `todo-ai-chatbot/` | Helm chart | K8s deployment manifests |
| `values.yaml` | Default config | Base Helm values |
| `values-secrets.yaml` | Sensitive config | Credentials (gitignored) |

**Health Checks**: All services MUST expose health endpoints for K8s liveness and readiness probes.

**Rationale**: Containerization ensures environment consistency, enables horizontal scaling, and provides production parity in local development.

---

## Phase V: Advanced Cloud Deployment Principles

### XIV. Event-Driven Architecture (Kafka)

The application MUST evolve from synchronous CRUD to event-driven architecture:
- Every significant task operation MUST produce a Kafka event
- Services communicate through Kafka topics, NOT direct API calls for async operations
- All events MUST follow strictly defined, versioned schemas
- Producers and consumers MUST be completely decoupled

**Kafka Topics**:
| Topic | Producer | Consumer(s) | Purpose |
|-------|----------|-------------|---------|
| `task-events` | Chat API (MCP Tools) | Recurring Task Service, Audit Service | All task CRUD operations |
| `reminders` | Chat API (due date set) | Notification Service | Scheduled reminder triggers |
| `task-updates` | Chat API | WebSocket Service | Real-time client sync |

**Event Schema Standards**:
- Every event MUST include: `event_type`, `task_id`, `user_id`, `timestamp`
- Schemas MUST be backward-compatible when updated
- Events MUST NOT contain sensitive data (passwords, tokens, API keys)
- Event IDs MUST support idempotent consumer processing

**Task Event Schema**:
```json
{
  "event_type": "created | updated | completed | deleted",
  "task_id": "integer",
  "task_data": "object (full task)",
  "user_id": "string",
  "timestamp": "ISO 8601 datetime"
}
```

**Reminder Event Schema**:
```json
{
  "task_id": "integer",
  "title": "string",
  "due_at": "ISO 8601 datetime",
  "remind_at": "ISO 8601 datetime",
  "user_id": "string"
}
```

**Infrastructure**:
- **Local (Minikube)**: Strimzi operator with ephemeral storage, single Kafka replica
- **Cloud**: Redpanda Cloud Serverless (free tier) OR Strimzi self-hosted on AKS/GKE/OKE

**Rationale**: Event-driven architecture decouples services, enables async processing (reminders, recurring tasks), provides a complete audit trail, and supports real-time multi-client sync.

### XV. Dapr Integration (Distributed Application Runtime)

All inter-service communication and infrastructure access MUST use Dapr building blocks when deployed on Kubernetes:
- Applications talk to Dapr sidecar via HTTP (`http://localhost:3500`), Dapr handles infrastructure
- Infrastructure changes (swap Kafka for RabbitMQ, PostgreSQL for Redis) MUST be achievable by changing YAML component configs, NOT application code
- Every microservice pod MUST run a Dapr sidecar (annotation: `dapr.io/enabled: "true"`)

**5 Required Dapr Building Blocks**:

| Building Block | Component | Use Case |
|----------------|-----------|----------|
| **Pub/Sub** | `pubsub.kafka` | Kafka event publishing/subscribing without kafka-python library |
| **State Management** | `state.postgresql` | Conversation state, task cache via Dapr State API |
| **Service Invocation** | Built-in | Frontend → Backend with auto-discovery, retries, mTLS |
| **Jobs API** | Built-in | Schedule exact-time reminders (no cron polling) |
| **Secrets Management** | `secretstores.kubernetes` | Secure API key and credential access |

**Dapr Component Naming Convention**:
- Component names MUST be consistent across all services and environments
- `kafka-pubsub` for Pub/Sub, `statestore` for State, `kubernetes-secrets` for Secrets

**Pub/Sub Pattern**:
```python
# Publishing (via Dapr - no Kafka library needed)
await httpx.post("http://localhost:3500/v1.0/publish/kafka-pubsub/task-events", json=event)

# Subscribing (Dapr calls your endpoint)
@app.post("/api/events/task-events")
async def handle_event(request: Request): ...
```

**Jobs API Pattern**:
```python
# Schedule reminder at exact time
await httpx.post(
    f"http://localhost:3500/v1.0-alpha1/jobs/reminder-task-{task_id}",
    json={"dueTime": remind_at.isoformat(), "data": {"task_id": task_id, "user_id": user_id}}
)

# Dapr calls back at scheduled time
@app.post("/api/jobs/trigger")
async def handle_job(request: Request): ...
```

**Rationale**: Dapr abstracts infrastructure behind simple HTTP APIs, keeps app code clean, enables backend swaps via config changes, and provides built-in retries, circuit breakers, and mTLS.

### XVI. Microservices Architecture

The application MUST decompose into specialized, independently deployable microservices:
- Each microservice has ONE specific responsibility (Single Responsibility Principle)
- Services communicate ONLY through Kafka events via Dapr Pub/Sub
- Each service has its own Dockerfile, health endpoint, and K8s deployment
- Services MUST NOT directly access other services' databases
- Services MUST NOT import or depend on each other's code

**Service Registry (6 Total)**:
| Service | Type | Kafka Topic | Purpose |
|---------|------|-------------|---------|
| **Frontend** | Existing | N/A | Next.js UI + Chat interface |
| **Backend (Chat API)** | Existing | Producer (all topics) | FastAPI + MCP tools, event publisher |
| **Notification Service** | New | Consumer: `reminders` | Send due-date reminders to users |
| **Recurring Task Service** | New | Consumer: `task-events` | Auto-create next task on completion |
| **Audit Service** | New | Consumer: `task-events` | Complete activity history (append-only) |
| **WebSocket Service** | New | Consumer: `task-updates` | Real-time broadcast to connected clients |

**Service Template**:
```
services/{service-name}/
  src/
    main.py           # FastAPI app entry point
    config.py         # Service configuration
    handlers/         # Event/request handlers
  tests/
    test_handlers.py  # Handler unit tests
  Dockerfile          # Multi-stage production build
  requirements.txt    # Python dependencies
  dapr/
    subscription.yaml # Dapr subscription config
```

**Service Requirements**:
- `GET /health` endpoint for K8s liveness/readiness probes
- Structured JSON logging (no plain text logs)
- Graceful shutdown (SIGTERM handling)
- Idempotent event processing (handle duplicates)
- Dapr sidecar annotations on K8s deployment

**Rationale**: Microservices enable independent scaling, deployment, and failure isolation. Event-driven communication ensures loose coupling and resilience.

### XVII. Advanced Task Features

The task model MUST be extended with advanced and intermediate features while maintaining backward compatibility:

**Advanced Features**:

| Feature | New Fields | Chat Integration |
|---------|-----------|-----------------|
| **Recurring Tasks** | `is_recurring`, `recurrence_pattern`, `recurrence_interval` | "add a daily task to check emails" |
| **Due Dates & Reminders** | `due_date`, `remind_at`, `reminder_sent` | "remind me about task 3 at 9am" |

**Intermediate Features**:

| Feature | New Fields | Chat Integration |
|---------|-----------|-----------------|
| **Priorities** | `priority` (high/medium/low, default: medium) | "add high priority task: fix bug" |
| **Tags** | `tags` (JSON array) | "add task with tags: work, urgent" |
| **Search** | N/A (PostgreSQL full-text) | "search for tasks about meeting" |
| **Filter** | N/A (query params) | "show my high priority tasks" |
| **Sort** | N/A (query params) | "list tasks sorted by due date" |

**Extended Intent Classification** (additions to Principle XI):

| Intent | Description | New Entities |
|--------|-------------|-------------|
| `add_task` | Extended | `priority`, `tags[]`, `is_recurring`, `recurrence_pattern` |
| `list_tasks` | Extended | `priority_filter`, `tag_filter`, `sort_by`, `sort_order`, `search_query` |
| `set_reminder` | New | `task_id`, `remind_at` |
| `search_tasks` | New | `search_query`, `filters` |

**Backward Compatibility Requirements**:
- All new fields MUST have sensible defaults (existing tasks unaffected)
- Existing API endpoints MUST remain functional
- New features MUST be additive, not breaking
- MCP tools MUST accept new optional parameters alongside existing ones

**Rationale**: Advanced features transform the basic CRUD app into a full-featured task management system while event-driven processing (Kafka + microservices) handles reminders and recurring tasks asynchronously.

### XVIII. Cloud-Native Deployment

The application MUST be deployable to production-grade Kubernetes on cloud providers:
- The SAME Helm chart MUST work on Minikube, AKS, GKE, and OKE with different `values-{env}.yaml` files
- ALL Kubernetes resources MUST be managed through Helm charts (no raw `kubectl apply` for app resources)
- Every infrastructure change MUST be in version-controlled YAML manifests

**Supported Cloud Providers**:
| Provider | Service | Credits | Notes |
|----------|---------|---------|-------|
| Azure | AKS | $200 / 30 days | Free trial |
| Google Cloud | GKE | $300 / 90 days | Free trial |
| Oracle Cloud | OKE | Always free | 4 OCPUs, 24GB RAM (recommended for learning) |

**Values File Strategy**:
```
todo-ai-chatbot/
  values.yaml              # Base defaults
  values-local.yaml        # Minikube overrides
  values-aks.yaml          # Azure AKS overrides
  values-gke.yaml          # Google GKE overrides
  values-oke.yaml          # Oracle OKE overrides
  values-secrets.yaml      # Sensitive values (GITIGNORED)
```

**Environment Differences**:
| Aspect | Minikube (Local) | Cloud (AKS/GKE/OKE) |
|--------|-----------------|---------------------|
| Image Pull | `Never` (local) | `Always` (registry) |
| Service Type | NodePort | LoadBalancer/Ingress |
| Kafka | Strimzi (ephemeral) | Redpanda Cloud / Strimzi |
| Dapr | Basic (5 blocks) | Full (5 blocks + production config) |
| Replicas | 1 per service | 2+ per service |
| TLS | None | Enabled |
| HPA | Disabled | Enabled |

**Deployment Requirements**:
- All containers MUST have CPU/memory requests and limits
- All services MUST have liveness and readiness probes
- Secrets MUST use K8s Secrets (never in ConfigMaps or env)
- RBAC MUST be configured for service accounts
- Helm chart MUST pass `helm lint` and `helm template` validation

**Rationale**: Cloud-native deployment with Helm ensures reproducible, scalable infrastructure that works identically across local development and production environments.

### XIX. CI/CD Pipeline

All build, test, and deployment processes MUST be automated via GitHub Actions:
- Every repeatable process MUST be in a GitHub Actions workflow
- CI MUST run on every PR and push to main
- CD MUST deploy automatically to staging, with manual approval for production
- Docker images MUST be built and pushed for all 6 services

**Pipeline Structure**:
```
.github/workflows/
  ci.yml              # Lint, test, build validation
  cd.yml              # Build, push, deploy
  docker-build.yml    # Docker image builds
  helm-deploy.yml     # Helm deployment
  release.yml         # Release automation
```

**CI Pipeline** (on PR/push):
1. Lint (ESLint, flake8, mypy)
2. Test frontend (Jest)
3. Test backend (pytest)
4. Test microservices (pytest)
5. Build Docker images (validation)
6. Helm lint

**CD Pipeline** (on main, after CI):
1. Build and push Docker images to registry
2. Deploy to staging cluster
3. Run smoke tests
4. Deploy to production (manual approval required)

**Pipeline Requirements**:
- NEVER commit secrets in workflow files; use GitHub Secrets
- ALWAYS use pinned action versions (`@v4`, not `@latest`)
- ALWAYS run tests before any deployment
- Production deployment MUST require manual approval
- NEVER deploy to production from feature branches
- Use caching for npm, pip, Docker layers

**Rationale**: Automated CI/CD ensures consistent quality, fast feedback, and reliable deployments while preventing human error in the release process.

### XX. Monitoring & Observability

All services MUST be instrumented with the three pillars of observability:

**1. Metrics (Prometheus)**:
- HTTP request rate, latency (p50/p95/p99), error rate per service
- Kafka consumer lag, message processing rate
- Dapr sidecar health and invocation metrics
- Pod CPU/memory usage, node utilization
- Python services: `prometheus_fastapi_instrumentator`

**2. Dashboards (Grafana)**:
- Overview dashboard: total requests, error rate, active users
- Per-service dashboards: latency, status codes, throughput
- Kafka dashboard: consumer lag, topic throughput
- Infrastructure dashboard: pod status, resource usage

**3. Logs (Loki)**:
- Centralized log aggregation with Promtail DaemonSet
- ALL services MUST use structured JSON logging
- Log labels: `app`, `namespace`, `pod`, `level`
- Python: `structlog` for structured logging

**4. Traces (Jaeger)**:
- End-to-end distributed tracing across all services
- OpenTelemetry SDK for instrumentation
- Trace context propagation through Dapr headers
- Configurable sampling: 100% (dev), 10% (prod)

**5. Alerting**:
| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | > 5% for 5min | Critical |
| HighLatency | p95 > 2s for 5min | Warning |
| KafkaConsumerLag | > 1000 for 10min | Warning |
| PodCrashLoop | > 3 restarts in 5min | Critical |
| ServiceDown | Health check fails 1min | Critical |

**Monitoring Stack**:
- `kube-prometheus-stack` Helm chart (Prometheus + Grafana + AlertManager)
- `loki-stack` Helm chart (Loki + Promtail)
- `jaeger` Helm chart (all-in-one for dev)

**Requirements**:
- Monitoring stack MUST NOT consume > 20% of cluster resources
- Dashboard configs MUST be version-controlled (JSON provisioning)
- Log rotation and retention policies MUST be configured
- All alerts MUST be tested with synthetic load before production

**Rationale**: Comprehensive observability enables proactive issue detection, faster debugging, and data-driven capacity planning.

---

## Technology Stack

### Phase II Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (React 18) |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 14+ (Neon Serverless) |
| Authentication | Better Auth (JWT) |
| API Protocol | REST over HTTPS |

### Phase III Stack (AI Chatbot)

| Layer | Technology |
|-------|------------|
| LLM Provider | Cohere API (command-r-plus) |
| Agent Framework | OpenAI Agent SDK (with Cohere adapter) |
| Backend Integration | Phase II FastAPI REST API |
| Runtime | Python 3.11+ |

### Phase IV Stack (Containerization)

| Layer | Technology |
|-------|------------|
| Containerization | Docker (multi-stage builds) |
| Orchestration | Kubernetes via Helm 3 |
| Local K8s | Minikube |
| Package Management | Helm charts |

### Phase V Stack (Advanced Cloud)

| Layer | Technology |
|-------|------------|
| Event Streaming | Apache Kafka (Strimzi / Redpanda Cloud) |
| App Runtime | Dapr 1.x (5 building blocks) |
| Microservices | Python 3.11+ (FastAPI) - 4 new services |
| Cloud K8s | AKS (Azure) / GKE (Google) / OKE (Oracle) |
| CI/CD | GitHub Actions |
| Metrics | Prometheus + Grafana |
| Logs | Loki + Promtail |
| Traces | Jaeger / OpenTelemetry |
| Alerting | Grafana Alerting / AlertManager |

**Constraints**:
- Python version: 3.11+
- Node.js version: 18+
- PostgreSQL version: 14+
- Cohere API: Latest stable version
- Dapr: 1.x (latest stable)
- Kubernetes: 1.27+
- Helm: 3.x

---

## Environment Variables

### Phase II/III Required Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `COHERE_API_KEY` | `.env.local` | Cohere API authentication |
| `COHERE_MODEL` | `.env.local` | Model selection (command-r-plus/command-r) |
| `BACKEND_API_URL` | `.env.local` | Phase II backend base URL |
| `BETTER_AUTH_SECRET` | `.env.local` | JWT verification (shared) |
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `AGENT_INTENT_TEMPERATURE` | `.env.local` | Intent analyzer temperature |
| `AGENT_RESPONSE_TEMPERATURE` | `.env.local` | Response composer temperature |
| `AGENT_MAX_TOKENS` | `.env.local` | Max tokens per agent response |

### Phase V Additional Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `KAFKA_BROKERS` | K8s Secret / `.env` | Kafka bootstrap servers |
| `KAFKA_SECURITY_PROTOCOL` | K8s Secret / `.env` | SASL_SSL for cloud, PLAINTEXT for local |
| `KAFKA_SASL_USERNAME` | K8s Secret | Kafka SASL username (cloud only) |
| `KAFKA_SASL_PASSWORD` | K8s Secret | Kafka SASL password (cloud only) |
| `DAPR_HTTP_PORT` | Dapr sidecar | Default: 3500 |
| `NOTIFICATION_EMAIL_PROVIDER` | K8s Secret | Email service credentials |
| `DOCKER_REGISTRY_URL` | GitHub Secret | Container registry URL |
| `KUBE_CONFIG` | GitHub Secret | K8s cluster credentials |

### File Locations

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Template with variable names (no values) | Committed |
| `.env.local` | Actual credentials | **GITIGNORED** |
| `backend/.env` | Backend-specific config | **GITIGNORED** |
| `frontend/.env` | Frontend-specific config | **GITIGNORED** |
| `values-secrets.yaml` | K8s Helm secrets | **GITIGNORED** |

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

### Kubernetes Security (Phase IV/V)

1. RBAC MUST be configured for all service accounts
2. Network policies MUST restrict inter-pod communication
3. Secrets MUST use K8s Secrets (never ConfigMaps or plain env)
4. Dapr secrets store MUST be used for application credential access
5. Container images MUST NOT run as root
6. Pod security standards MUST be enforced

### Inter-Service Security (Phase V)

1. Dapr mTLS MUST be enabled for service-to-service communication
2. Kafka SASL/SSL MUST be used for cloud deployments
3. Event payloads MUST NOT contain sensitive credentials
4. Audit service MUST log all access for compliance
5. WebSocket connections MUST validate user authentication

### Security Controls

- **Token Verification**: All endpoints require valid JWT (except health checks)
- **Path Authorization**: `user_id` in path MUST match token's `user_id`
- **Input Validation**: All inputs MUST be validated against schemas
- **Error Handling**: Error responses MUST NOT leak internal details
- **CORS**: Configure allowed origins explicitly for production
- **Rate Limiting**: Implement rate limiting on authentication endpoints
- **API Key Protection**: Cohere API key MUST be server-side only, never exposed to client
- **Container Security**: Non-root containers, read-only filesystems where possible
- **Network Isolation**: K8s network policies for production clusters

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

### Phase V Advanced Cloud

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Event Processing Latency | < 1 second | Kafka consumer lag |
| Service Availability | > 99.5% | Uptime monitoring |
| Reminder Delivery Accuracy | > 99% | Notification success rate |
| Recurring Task Creation | 100% on completion | Event processing audit |
| Audit Trail Completeness | 100% events logged | Audit service verification |
| Real-time Sync Delay | < 500ms | WebSocket latency |
| CI Pipeline Duration | < 10 minutes | GitHub Actions metrics |
| Deployment Success Rate | > 95% | CD pipeline metrics |
| Dashboard Coverage | All 6 services | Grafana dashboard count |
| Alert False Positive Rate | < 10% | Alert review |

---

**Version**: 3.0.0 | **Ratified**: 2026-01-09 | **Last Amended**: 2026-02-12

**Changelog**:
- v1.0.0 (2026-01-09): Initial constitution with Phase II principles (I-VI)
- v2.0.0 (2026-02-03): Added Phase III AI Chatbot principles (VII-XII), Cohere integration, multi-agent architecture
- v3.0.0 (2026-02-12): Added Phase IV Containerization (XIII), Phase V Advanced Cloud principles (XIV-XX): Event-Driven Architecture (Kafka), Dapr Integration, Microservices Architecture, Advanced Task Features, Cloud-Native Deployment, CI/CD Pipeline, Monitoring & Observability
