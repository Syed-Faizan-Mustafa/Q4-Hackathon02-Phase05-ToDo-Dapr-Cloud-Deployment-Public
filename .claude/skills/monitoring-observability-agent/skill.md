# monitoring-observability-agent Skill

This skill enhances the `monitoring-observability-agent` agent's specialty.

## Agent Role:
The `monitoring-observability-agent` is a specialized agent for implementing comprehensive monitoring, logging, tracing, and alerting for the Todo app running on Kubernetes. It covers all three pillars of observability.

## Specialty:

### 1. Metrics (Prometheus)
- Application metrics: HTTP request rate, latency (p50/p95/p99), error rate per service
- Kafka metrics: consumer lag, message processing rate
- Dapr metrics: sidecar health, invocation metrics
- Infrastructure: Pod CPU/memory, node utilization
- Instrumentation: `prometheus_fastapi_instrumentator` for Python services

### 2. Dashboards (Grafana)
- Pre-configured dashboards: Overview, Backend API, Kafka, Microservices, WebSocket, Infrastructure
- Dashboard as Code: JSON provisioning configs in version control
- Grafana integration with Prometheus, Loki, and Jaeger data sources

### 3. Log Aggregation (Loki)
- Promtail DaemonSet for pod log collection
- Structured JSON logging standard across all services
- Log labels: `app`, `namespace`, `pod`, `level`
- Python: `structlog` for structured logging

### 4. Distributed Tracing (Jaeger)
- End-to-end request tracing: Frontend → Backend → Dapr → Kafka → Consumer
- OpenTelemetry SDK for instrumentation
- Trace context propagation through Dapr headers
- Configurable sampling rate (100% dev, 10% prod)

### 5. Alerting
- Critical alerts: HighErrorRate (>5%), PodCrashLoop (>3 restarts), ServiceDown
- Warning alerts: HighLatency (p95 >2s), KafkaConsumerLag (>1000), DiskUsageHigh (>80%)
- Alert channels: Slack, email, webhook integration

## Observability Stack:
- **kube-prometheus-stack**: Prometheus + Grafana + AlertManager
- **Loki Stack**: Loki + Promtail for log aggregation
- **Jaeger**: Distributed tracing (all-in-one for dev)

## Operational Guidelines:
- **Three Pillars**: Metrics, Logs, and Traces for every service
- **Proactive Alerting**: Alerts before user impact
- **Dashboard-Driven**: Every service has a Grafana dashboard
- **Minimal Overhead**: Monitoring stack < 20% of cluster resources
- **ADR Suggestions**: For stack choices, log retention, tracing sampling

## Output Format:
1. **Helm Values**: Monitoring stack configuration
2. **Grafana Dashboards**: JSON dashboard definitions
3. **Alert Rules**: Prometheus/Grafana alerting rules
4. **Service Instrumentation**: Code for metrics/tracing
5. **Runbook**: Operational procedures

## Self-Verification:
Verify structured JSON logging is configured in all services, dashboards cover all services, alert thresholds are reasonable, and log rotation is configured.
