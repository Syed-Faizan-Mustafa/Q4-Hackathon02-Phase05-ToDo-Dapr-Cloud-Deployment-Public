#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# setup-minikube.sh - Initialize Minikube cluster with Dapr for Todo App
# =============================================================================
# Idempotent: safe to run multiple times
# Prerequisites: minikube, kubectl, dapr CLI installed
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MINIKUBE_CPUS="${MINIKUBE_CPUS:-4}"
MINIKUBE_MEMORY="${MINIKUBE_MEMORY:-8192}"
MINIKUBE_DRIVER="${MINIKUBE_DRIVER:-docker}"
MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-minikube}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---- Check prerequisites ----
check_prerequisites() {
  local missing=()
  for cmd in minikube kubectl dapr helm; do
    if ! command -v "$cmd" &>/dev/null; then
      missing+=("$cmd")
    fi
  done
  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing required tools: ${missing[*]}"
    echo "Install them before running this script."
    exit 1
  fi
  log_info "All prerequisites found."
}

# ---- Start Minikube ----
start_minikube() {
  if minikube status -p "$MINIKUBE_PROFILE" &>/dev/null; then
    log_info "Minikube is already running (profile: $MINIKUBE_PROFILE)."
  else
    log_info "Starting Minikube (${MINIKUBE_CPUS} CPUs, ${MINIKUBE_MEMORY}MB RAM, driver: $MINIKUBE_DRIVER)..."
    minikube start \
      -p "$MINIKUBE_PROFILE" \
      --cpus="$MINIKUBE_CPUS" \
      --memory="$MINIKUBE_MEMORY" \
      --driver="$MINIKUBE_DRIVER" \
      --kubernetes-version=stable
    log_info "Minikube started successfully."
  fi
}

# ---- Install Dapr ----
install_dapr() {
  if kubectl get namespace dapr-system &>/dev/null 2>&1; then
    log_info "Dapr is already installed in the cluster."
  else
    log_info "Installing Dapr into the cluster..."
    dapr init -k --wait
    log_info "Dapr installed successfully."
  fi

  log_info "Dapr status:"
  dapr status -k || true
}

# ---- Create Namespaces ----
create_namespaces() {
  for ns in todo-app kafka; do
    if kubectl get namespace "$ns" &>/dev/null 2>&1; then
      log_info "Namespace '$ns' already exists."
    else
      log_info "Creating namespace '$ns'..."
      kubectl create namespace "$ns"
    fi
  done
}

# ---- Enable Minikube Addons ----
enable_addons() {
  log_info "Enabling metrics-server addon..."
  minikube addons enable metrics-server -p "$MINIKUBE_PROFILE" || true
}

# ---- Main ----
main() {
  echo "============================================="
  echo "  Todo App - Minikube Cluster Setup"
  echo "============================================="
  echo ""

  check_prerequisites
  start_minikube
  install_dapr
  create_namespaces
  enable_addons

  echo ""
  log_info "Setup complete! Cluster is ready."
  echo ""
  echo "Next steps:"
  echo "  1. Build images:  ./build-images.sh"
  echo "  2. Deploy app:    ./deploy.sh"
  echo ""
}

main "$@"
