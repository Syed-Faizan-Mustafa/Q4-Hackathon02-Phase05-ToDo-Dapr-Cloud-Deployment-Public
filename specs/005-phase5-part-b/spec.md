# Specification: Phase 5 Part B - Minikube + Dapr Local Deployment

**Feature**: 005-phase5-part-b
**Date**: 2026-02-13
**Status**: Draft

---

## 1. Overview

Deploy the full Todo application stack (frontend, backend, 4 microservices, Kafka, Dapr) on a local Minikube Kubernetes cluster. This validates the event-driven architecture from Part A in a containerized, orchestrated environment before cloud deployment in Part C.

## 2. Goals

- Deploy all 6 application services on Minikube with Dapr sidecars
- Deploy Kafka + Zookeeper on Minikube for local event streaming
- Create reusable Helm chart for the entire stack
- Provide one-command deployment script
- Validate inter-service communication via Dapr Pub/Sub + Service Invocation

## 3. Non-Goals

- Cloud provider deployment (Part C)
- CI/CD pipelines (Part C)
- Monitoring/observability stack (Part C)
- TLS/SSL for local development
- External database (uses existing Neon PostgreSQL)

## 4. Architecture

```
Minikube Cluster
├── Namespace: todo-app
│   ├── backend (FastAPI + Dapr sidecar)
│   ├── frontend (Next.js)
│   ├── audit-service (FastAPI + Dapr sidecar)
│   ├── notification-service (FastAPI + Dapr sidecar)
│   ├── recurring-task-service (FastAPI + Dapr sidecar)
│   └── websocket-service (FastAPI + Dapr sidecar)
├── Namespace: kafka
│   ├── zookeeper (StatefulSet)
│   └── kafka (StatefulSet)
└── Dapr System
    ├── dapr-operator
    ├── dapr-sidecar-injector
    ├── dapr-placement
    └── dapr-sentry
```

## 5. Services

| Service | Image | Port | Dapr App ID | Dapr Port |
|---------|-------|------|-------------|-----------|
| Backend | todo-backend:latest | 8000 | backend | 3500 |
| Frontend | todo-frontend:latest | 3000 | frontend | - |
| Audit | audit-service:latest | 8080 | audit-service | 3500 |
| Notification | notification-service:latest | 8080 | notification-service | 3500 |
| Recurring Task | recurring-task-service:latest | 8080 | recurring-task-service | 3500 |
| WebSocket | websocket-service:latest | 8080 | websocket-service | 3500 |

## 6. Infrastructure Dependencies

- **Minikube**: v1.32+ with Docker driver
- **kubectl**: v1.28+
- **Helm**: v3.13+
- **Dapr CLI**: v1.13+ (installs Dapr into cluster)
- **Docker**: for building images into Minikube's registry

## 7. Helm Chart Structure

```
helm/todo-app/
├── Chart.yaml
├── values.yaml
├── values-local.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── audit-deployment.yaml
│   ├── audit-service.yaml
│   ├── notification-deployment.yaml
│   ├── notification-service.yaml
│   ├── recurring-deployment.yaml
│   ├── recurring-service.yaml
│   ├── websocket-deployment.yaml
│   ├── websocket-service.yaml
│   ├── kafka-statefulset.yaml
│   ├── kafka-service.yaml
│   ├── zookeeper-statefulset.yaml
│   ├── zookeeper-service.yaml
│   └── dapr-components.yaml
└── scripts/
    ├── setup-minikube.sh
    ├── build-images.sh
    ├── deploy.sh
    └── teardown.sh
```

## 8. Acceptance Criteria

- [ ] `minikube start` + `dapr init -k` sets up the cluster
- [ ] All 6 Docker images build successfully
- [ ] `helm install todo-app ./helm/todo-app` deploys the full stack
- [ ] All pods reach Running state within 5 minutes
- [ ] Backend API accessible via `minikube service backend --url`
- [ ] Frontend accessible via `minikube service frontend --url`
- [ ] Dapr sidecars injected on all 5 Dapr-enabled services
- [ ] Event flow: create task -> backend publishes event -> audit service logs it
- [ ] Kafka + Zookeeper pods are healthy
- [ ] `helm uninstall todo-app` cleans up all resources
