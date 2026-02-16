# Tasks: Phase 5 Part B - Minikube + Dapr Local Deployment

**Feature**: 005-phase5-part-b
**Date**: 2026-02-13
**Plan Reference**: `specs/005-phase5-part-b/plan.md`

---

## Phase 1: Helm Chart Scaffolding

### T001: Create Helm Chart Structure
**Blocked by**: None
**Priority**: P1

**Description**: Create the Helm chart skeleton with Chart.yaml, values.yaml, values-local.yaml, and _helpers.tpl.

**Acceptance**:
- [ ] Chart.yaml with correct metadata
- [ ] values.yaml with all configurable parameters
- [ ] values-local.yaml with Minikube overrides
- [ ] _helpers.tpl with standard label/selector helpers
- [ ] `helm lint` passes

---

## Phase 2: Kafka + Zookeeper

### T002: Create Zookeeper Manifests
**Blocked by**: T001
**Priority**: P1

**Description**: Create Zookeeper StatefulSet and Service templates.

**Acceptance**:
- [ ] StatefulSet with 1 replica, port 2181
- [ ] Headless service for StatefulSet DNS
- [ ] PersistentVolumeClaim (1Gi)
- [ ] Readiness probe on port 2181

---

### T003: Create Kafka Manifests
**Blocked by**: T002
**Priority**: P1

**Description**: Create Kafka StatefulSet and Service templates.

**Acceptance**:
- [ ] StatefulSet with 1 replica, ports 9092/29092
- [ ] Connects to Zookeeper via DNS
- [ ] Auto-create topics enabled
- [ ] PersistentVolumeClaim (2Gi)
- [ ] Readiness probe
- [ ] ClusterIP service for internal access

---

## Phase 3: Application Deployments

### T004: Create Kubernetes Secrets Template
**Blocked by**: T001
**Priority**: P1

**Description**: Create secrets template for DATABASE_URL, JWT keys, and other sensitive config.

**Acceptance**:
- [ ] Secrets template with all required keys
- [ ] Values reference for secret data
- [ ] Referenced by backend and other services

---

### T005: Create Backend Deployment + Service
**Blocked by**: T004
**Priority**: P1

**Description**: Create backend Deployment and Service with Dapr annotations.

**Acceptance**:
- [ ] Deployment with Dapr sidecar annotations (app-id: backend, port: 8000)
- [ ] Environment variables from secrets + configmap
- [ ] NodePort service for external access
- [ ] Health check probes
- [ ] Resource limits

---

### T006: Create Frontend Deployment + Service
**Blocked by**: T004
**Priority**: P1

**Description**: Create frontend Deployment and Service (no Dapr sidecar).

**Acceptance**:
- [ ] Deployment without Dapr annotations
- [ ] NEXT_PUBLIC_API_URL pointing to backend service
- [ ] NodePort service for external access
- [ ] Health check probes

---

### T007: Create 4 Microservice Deployments + Services
**Blocked by**: T004
**Priority**: P1

**Description**: Create Deployment and Service for audit, notification, recurring-task, and websocket services.

**Acceptance**:
- [ ] All 4 deployments with Dapr sidecar annotations
- [ ] Correct app-id and app-port for each
- [ ] ClusterIP services (internal only)
- [ ] Health check probes
- [ ] Appropriate env vars per service

---

## Phase 4: Dapr Components

### T008: Create Dapr Component CRDs
**Blocked by**: T003
**Priority**: P1

**Description**: Create Dapr component templates that reference in-cluster Kafka and PostgreSQL.

**Acceptance**:
- [ ] kafka-pubsub component pointing to kafka.kafka.svc.cluster.local:9092
- [ ] statestore component with PostgreSQL connection from secret
- [ ] Correct scoping to appropriate services
- [ ] Components deployed in todo-app namespace

---

## Phase 5: Deployment Scripts

### T009: Create setup-minikube.sh
**Blocked by**: None
**Priority**: P1

**Description**: Script to initialize Minikube cluster with Dapr.

**Acceptance**:
- [ ] Starts Minikube (4 CPUs, 8GB RAM, Docker driver)
- [ ] Installs Dapr into cluster
- [ ] Creates namespaces
- [ ] Idempotent (safe to run multiple times)

---

### T010: Create build-images.sh
**Blocked by**: None
**Priority**: P1

**Description**: Script to build all 6 Docker images in Minikube's Docker daemon.

**Acceptance**:
- [ ] Points to Minikube's Docker registry
- [ ] Builds all 6 images with consistent tags
- [ ] Reports build status

---

### T011: Create deploy.sh
**Blocked by**: T001-T008
**Priority**: P1

**Description**: One-command deployment script.

**Acceptance**:
- [ ] Creates secrets from environment or .env file
- [ ] Deploys Kafka namespace + resources first
- [ ] Waits for Kafka to be ready
- [ ] Helm installs the todo-app chart
- [ ] Waits for all pods to be ready
- [ ] Prints access URLs via minikube service

---

### T012: Create teardown.sh
**Blocked by**: None
**Priority**: P2

**Description**: Script to clean up all resources.

**Acceptance**:
- [ ] Helm uninstalls the chart
- [ ] Deletes Kafka namespace
- [ ] Optionally deletes Minikube cluster

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1. Helm Scaffolding | T001 | P1 |
| 2. Kafka + Zookeeper | T002-T003 | P1 |
| 3. App Deployments | T004-T007 | P1 |
| 4. Dapr Components | T008 | P1 |
| 5. Scripts | T009-T012 | P1-P2 |

**Total**: 12 tasks across 5 phases
**Critical Path**: T001 → T004 → T005-T007 → T008 → T011
