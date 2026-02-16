# Implementation Plan: Phase 5 Part B - Minikube + Dapr Local Deployment

**Feature**: 005-phase5-part-b
**Date**: 2026-02-13
**Spec Reference**: `specs/005-phase5-part-b/spec.md`

---

## 1. Implementation Phases

```
Phase 1: Helm Chart Scaffolding        (Foundation)
Phase 2: Kafka + Zookeeper Manifests   (Infrastructure)
Phase 3: Application Deployments       (6 Services)
Phase 4: Dapr Components               (Event Wiring)
Phase 5: Deployment Scripts            (Automation)
```

---

## 2. Phase 1: Helm Chart Scaffolding

### 2.1 Chart.yaml
- Name: `todo-app`
- Version: `1.0.0`
- App version: `5.0.0`
- Description: "Todo Full-Stack App with Event-Driven Microservices"

### 2.2 values.yaml
Global defaults for all environments:
- Image tags, pull policy
- Replica counts (1 for local)
- Resource limits (minimal for Minikube)
- Database URL (from secret)
- Dapr settings (enabled: true)
- Kafka broker address

### 2.3 values-local.yaml
Minikube-specific overrides:
- `imagePullPolicy: Never` (use local images)
- Reduced resource limits
- NodePort service types for frontend/backend access

### 2.4 _helpers.tpl
Standard Helm template helpers for labels, names, selectors.

---

## 3. Phase 2: Kafka + Zookeeper

### 3.1 Zookeeper StatefulSet
- Single replica for local dev
- Port 2181
- PersistentVolumeClaim for data (1Gi)

### 3.2 Kafka StatefulSet
- Single replica for local dev
- Port 9092 (internal), 29092 (external)
- Depends on Zookeeper
- Auto-create topics enabled
- PersistentVolumeClaim for data (2Gi)
- Topics: task-events, task-updates, reminders

### 3.3 Kafka Services
- Headless service for StatefulSet DNS
- ClusterIP service for internal access

---

## 4. Phase 3: Application Deployments

Each service follows the same pattern:

### 4.1 Deployment Template
```yaml
spec:
  replicas: 1
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"        # (except frontend)
        dapr.io/app-id: "<service-name>"
        dapr.io/app-port: "<port>"
    spec:
      containers:
      - name: <service>
        image: <image>:<tag>
        ports:
        - containerPort: <port>
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef: ...
        resources:
          requests: { cpu: 50m, memory: 64Mi }
          limits: { cpu: 200m, memory: 256Mi }
        readinessProbe: /health
        livenessProbe: /health
```

### 4.2 Service Template
- ClusterIP for microservices
- NodePort for frontend + backend (accessible from host)

### 4.3 Service-Specific Notes

| Service | Special Config |
|---------|---------------|
| Backend | DATABASE_URL, JWT_PUBLIC_KEY from secrets; DAPR_URL env |
| Frontend | NEXT_PUBLIC_API_URL, BACKEND_URL pointing to backend service; no Dapr sidecar |
| Audit | DAPR_URL, STATE_STORE env vars |
| Notification | DAPR_URL, STATE_STORE, PUBSUB_NAME |
| Recurring Task | DAPR_URL, BACKEND_APP_ID |
| WebSocket | JWT_PUBLIC_KEY from secret |

---

## 5. Phase 4: Dapr Components

Deploy Dapr component CRDs into the cluster:

### 5.1 kafka-pubsub Component
- Reference Kafka broker at `kafka.kafka.svc.cluster.local:9092`
- Scoped to all 5 Dapr-enabled services

### 5.2 statestore Component
- PostgreSQL state store using the same Neon DB
- Scoped to audit-service, notification-service

### 5.3 Secrets
- Kubernetes secrets for DATABASE_URL, JWT keys
- Referenced by statestore component

---

## 6. Phase 5: Deployment Scripts

### 6.1 setup-minikube.sh
1. Start Minikube with Docker driver (4 CPUs, 8GB RAM)
2. Enable ingress addon
3. Install Dapr into cluster (`dapr init -k`)
4. Create namespaces (todo-app, kafka)

### 6.2 build-images.sh
1. Point Docker to Minikube's registry (`eval $(minikube docker-env)`)
2. Build all 6 images with tags

### 6.3 deploy.sh
1. Create K8s secrets
2. Deploy Kafka + Zookeeper (wait for ready)
3. Deploy Dapr components
4. Helm install todo-app
5. Wait for all pods to be ready
6. Print access URLs

### 6.4 teardown.sh
1. Helm uninstall
2. Delete namespaces
3. Optionally stop Minikube

---

## 7. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Kafka deployment | StatefulSet in K8s | Simpler than operator for local dev; single replica |
| Image registry | Minikube's Docker daemon | No external registry needed; `imagePullPolicy: Never` |
| Database | External Neon PostgreSQL | Reuse existing DB; no local PostgreSQL needed |
| Service exposure | NodePort | Simple host access via `minikube service` |
| Resource limits | Minimal (50m-200m CPU) | Minikube has limited resources |
