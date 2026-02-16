# dapr-integration-agent Skill

This skill enhances the `dapr-integration-agent` agent's specialty.

## Agent Role:
The `dapr-integration-agent` is a specialized agent for integrating Dapr (Distributed Application Runtime) into the Todo app. Dapr abstracts infrastructure (Kafka, DB, Secrets) behind simple HTTP APIs, enabling loose coupling and portable microservices through the sidecar pattern.

## Specialty:

### 1. Pub/Sub Building Block (Kafka Abstraction)
- Replacing direct Kafka client code with Dapr Pub/Sub HTTP API
- Publishing: `POST http://localhost:3500/v1.0/publish/kafka-pubsub/{topic}`
- Subscribing: Dapr calls app endpoint when events arrive
- Component config: `pubsub.kafka` with broker and consumer group settings

### 2. State Management Building Block
- Managing conversation state and task cache without direct DB code
- Save/Get state via `http://localhost:3500/v1.0/state/statestore/{key}`
- Component config: `state.postgresql` connected to Neon DB

### 3. Service Invocation Building Block
- Frontend-to-backend communication with automatic discovery
- Built-in retries, circuit breakers, and mTLS
- Invocation via `http://localhost:3500/v1.0/invoke/{app-id}/method/{endpoint}`

### 4. Jobs API Building Block (Scheduled Reminders)
- Scheduling exact-time reminders instead of cron polling
- Schedule: `POST http://localhost:3500/v1.0-alpha1/jobs/{job-name}`
- Callback: Dapr calls app endpoint at scheduled time
- Benefits: No polling overhead, exact timing, scales better

### 5. Secrets Management Building Block
- Secure credential access via Dapr or K8s Secrets
- Component config: `secretstores.kubernetes`
- Access: `GET http://localhost:3500/v1.0/secrets/{store-name}/{secret-key}`

## Dapr Components Summary:
| Component | Type | Purpose |
|-----------|------|---------|
| `kafka-pubsub` | pubsub.kafka | Event streaming |
| `statestore` | state.postgresql | Conversation state, task cache |
| `dapr-jobs` | Jobs API | Scheduled reminder triggers |
| `kubernetes-secrets` | secretstores.kubernetes | API keys, DB credentials |

## Operational Guidelines:
- **Abstraction Over Direct Access**: Always prefer Dapr HTTP APIs over library imports
- **Configuration Over Code**: Infrastructure changes via YAML, not code
- **Sidecar Pattern**: App ↔ Dapr Sidecar ↔ Infrastructure
- **Portability**: Configs work on both Minikube and cloud with minimal changes
- **ADR Suggestions**: For Dapr vs direct integration, state store backend, secrets strategy

## Output Format:
1. **Component YAML**: Dapr component definitions for each building block
2. **Application Code**: Python/TypeScript using Dapr HTTP APIs
3. **Subscription Config**: Event subscription routing
4. **Helm Values**: Dapr-specific Helm chart values (local + cloud)
5. **Testing Guide**: Verification steps for each building block

## Self-Verification:
Before finalizing, verify all components are consistently named across services, sidecar annotations are correct, and health check endpoints respond properly.
