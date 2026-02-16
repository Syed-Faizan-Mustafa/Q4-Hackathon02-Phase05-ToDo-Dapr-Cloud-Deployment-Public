#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# deploy.sh - One-command deployment for Todo App on Minikube
# =============================================================================
# Reads secrets from .env file or environment variables, then deploys the full
# stack using Helm with local Minikube values.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-minikube}"
RELEASE_NAME="${RELEASE_NAME:-todo-app}"
HELM_TIMEOUT="${HELM_TIMEOUT:-5m}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---- Load .env file ----
load_env() {
  local env_file="${ENV_FILE:-$PROJECT_ROOT/.env}"
  if [ -f "$env_file" ]; then
    log_info "Loading environment from $env_file"
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  else
    log_warn "No .env file found at $env_file. Using existing environment variables."
  fi
}

# ---- Validate required secrets ----
validate_secrets() {
  local missing=()

  [ -z "${DATABASE_URL:-}" ] && missing+=("DATABASE_URL")
  [ -z "${JWT_PUBLIC_KEY:-}" ] && missing+=("JWT_PUBLIC_KEY")
  [ -z "${COHERE_API_KEY:-}" ] && missing+=("COHERE_API_KEY")

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing required environment variables: ${missing[*]}"
    echo ""
    echo "Set them in a .env file or export them before running this script:"
    echo "  DATABASE_URL=postgresql://..."
    echo "  JWT_PUBLIC_KEY=..."
    echo "  COHERE_API_KEY=..."
    exit 1
  fi

  log_info "All required secrets are set."
}

# ---- Ensure namespaces exist ----
ensure_namespaces() {
  for ns in todo-app kafka; do
    kubectl get namespace "$ns" &>/dev/null 2>&1 || kubectl create namespace "$ns"
  done
  log_info "Namespaces ready."
}

# ---- Deploy with Helm ----
deploy_helm() {
  log_info "Deploying with Helm (release: $RELEASE_NAME)..."

  local jwt_algorithm="${JWT_ALGORITHM:-RS256}"
  local jwt_issuer="${JWT_ISSUER:-}"

  helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" \
    -f "$CHART_DIR/values.yaml" \
    -f "$CHART_DIR/values-local.yaml" \
    --set "secrets.databaseUrl=$DATABASE_URL" \
    --set "secrets.jwtPublicKey=$JWT_PUBLIC_KEY" \
    --set "secrets.jwtAlgorithm=$jwt_algorithm" \
    --set "secrets.jwtIssuer=$jwt_issuer" \
    --set "secrets.cohereApiKey=$COHERE_API_KEY" \
    --timeout "$HELM_TIMEOUT" \
    --wait

  log_info "Helm deployment complete."
}

# ---- Wait for pods ----
wait_for_pods() {
  log_info "Waiting for all pods to be ready in 'todo-app' namespace..."
  kubectl wait --for=condition=ready pod --all \
    -n todo-app \
    --timeout=300s || {
    log_warn "Some pods may not be ready yet. Checking status..."
    kubectl get pods -n todo-app
    return 0
  }

  log_info "Waiting for Kafka pods in 'kafka' namespace..."
  kubectl wait --for=condition=ready pod --all \
    -n kafka \
    --timeout=300s || {
    log_warn "Kafka pods may not be ready yet."
    kubectl get pods -n kafka
    return 0
  }

  log_info "All pods are ready!"
}

# ---- Print access URLs ----
print_urls() {
  echo ""
  echo "============================================="
  echo "  Deployment Complete!"
  echo "============================================="
  echo ""

  local minikube_ip
  minikube_ip="$(minikube ip -p "$MINIKUBE_PROFILE" 2>/dev/null || echo "127.0.0.1")"

  echo "  Frontend:   http://$minikube_ip:30000"
  echo "  Backend:    http://$minikube_ip:30080"
  echo "  WebSocket:  ws://$minikube_ip:30088"
  echo ""

  echo "  Or use minikube service tunnels:"
  echo "    minikube service frontend -n todo-app -p $MINIKUBE_PROFILE --url"
  echo "    minikube service backend -n todo-app -p $MINIKUBE_PROFILE --url"
  echo ""

  echo "  Pod Status:"
  kubectl get pods -n todo-app -o wide 2>/dev/null || true
  echo ""
  kubectl get pods -n kafka -o wide 2>/dev/null || true
  echo ""

  echo "  Dapr Components:"
  kubectl get components -n todo-app 2>/dev/null || true
  echo ""
}

# ---- Main ----
main() {
  echo "============================================="
  echo "  Todo App - Deploy to Minikube"
  echo "============================================="
  echo ""

  load_env
  validate_secrets
  ensure_namespaces
  deploy_helm
  wait_for_pods
  print_urls
}

main "$@"
