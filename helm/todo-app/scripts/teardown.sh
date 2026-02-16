#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# teardown.sh - Clean up all Todo App resources from Minikube
# =============================================================================
# Usage:
#   ./teardown.sh           # Remove app resources only
#   ./teardown.sh --all     # Remove app + delete Minikube cluster
# =============================================================================

RELEASE_NAME="${RELEASE_NAME:-todo-app}"
MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-minikube}"
DELETE_CLUSTER=false

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---- Parse arguments ----
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --all)
        DELETE_CLUSTER=true
        shift
        ;;
      *)
        log_warn "Unknown argument: $1"
        shift
        ;;
    esac
  done
}

# ---- Helm uninstall ----
uninstall_helm() {
  if helm status "$RELEASE_NAME" &>/dev/null 2>&1; then
    log_info "Uninstalling Helm release '$RELEASE_NAME'..."
    helm uninstall "$RELEASE_NAME"
    log_info "Helm release removed."
  else
    log_info "Helm release '$RELEASE_NAME' not found (already removed)."
  fi
}

# ---- Delete namespaces ----
delete_namespaces() {
  for ns in todo-app kafka; do
    if kubectl get namespace "$ns" &>/dev/null 2>&1; then
      log_info "Deleting namespace '$ns'..."
      kubectl delete namespace "$ns" --timeout=120s || {
        log_warn "Namespace '$ns' deletion timed out. It may still be terminating."
      }
    else
      log_info "Namespace '$ns' not found (already deleted)."
    fi
  done
}

# ---- Uninstall Dapr ----
uninstall_dapr() {
  if kubectl get namespace dapr-system &>/dev/null 2>&1; then
    log_info "Uninstalling Dapr from cluster..."
    dapr uninstall -k || log_warn "Dapr uninstall had issues (may already be removed)."
  else
    log_info "Dapr not found in cluster."
  fi
}

# ---- Delete Minikube cluster ----
delete_minikube() {
  if $DELETE_CLUSTER; then
    log_info "Deleting Minikube cluster (profile: $MINIKUBE_PROFILE)..."
    minikube delete -p "$MINIKUBE_PROFILE"
    log_info "Minikube cluster deleted."
  else
    log_info "Minikube cluster kept running. Use --all to delete it."
  fi
}

# ---- Main ----
main() {
  parse_args "$@"

  echo "============================================="
  echo "  Todo App - Teardown"
  echo "============================================="
  echo ""

  if $DELETE_CLUSTER; then
    log_warn "Full teardown requested (--all). This will delete the Minikube cluster."
  fi

  uninstall_helm
  delete_namespaces

  if $DELETE_CLUSTER; then
    uninstall_dapr
    delete_minikube
  fi

  echo ""
  log_info "Teardown complete!"

  if ! $DELETE_CLUSTER; then
    echo ""
    echo "  Minikube cluster is still running."
    echo "  To fully remove: ./teardown.sh --all"
  fi
  echo ""
}

main "$@"
