#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# build-images.sh - Build all Docker images inside Minikube's Docker daemon
# =============================================================================
# This ensures images are available to Minikube without a registry.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-minikube}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Image definitions: name → Dockerfile context
declare -A IMAGES=(
  ["todo-backend"]="$PROJECT_ROOT/backend"
  ["todo-frontend"]="$PROJECT_ROOT/frontend"
  ["audit-service"]="$PROJECT_ROOT/services/audit-service"
  ["notification-service"]="$PROJECT_ROOT/services/notification-service"
  ["recurring-task-service"]="$PROJECT_ROOT/services/recurring-task-service"
  ["websocket-service"]="$PROJECT_ROOT/services/websocket-service"
)

# ---- Point Docker to Minikube ----
setup_docker_env() {
  log_info "Configuring Docker to use Minikube's daemon (profile: $MINIKUBE_PROFILE)..."
  eval "$(minikube docker-env -p "$MINIKUBE_PROFILE")"
  log_info "Docker is now pointing to Minikube's daemon."
}

# ---- Build a single image ----
build_image() {
  local name="$1"
  local context="$2"
  local dockerfile="$context/Dockerfile"

  if [ ! -f "$dockerfile" ]; then
    log_error "Dockerfile not found: $dockerfile"
    return 1
  fi

  log_info "Building $name:$IMAGE_TAG from $context ..."
  docker build -t "$name:$IMAGE_TAG" -f "$dockerfile" "$context"
  log_info "$name:$IMAGE_TAG built successfully."
}

# ---- Build all images ----
build_all() {
  local total=${#IMAGES[@]}
  local count=0
  local failed=()

  for name in "${!IMAGES[@]}"; do
    count=$((count + 1))
    echo ""
    echo "--- [$count/$total] $name ---"
    if build_image "$name" "${IMAGES[$name]}"; then
      :
    else
      failed+=("$name")
    fi
  done

  echo ""
  echo "============================================="
  echo "  Build Summary"
  echo "============================================="
  echo "  Total:   $total"
  echo "  Success: $((total - ${#failed[@]}))"
  echo "  Failed:  ${#failed[@]}"

  if [ ${#failed[@]} -gt 0 ]; then
    log_error "Failed images: ${failed[*]}"
    exit 1
  fi

  log_info "All images built successfully!"
  echo ""
  echo "Images available in Minikube:"
  docker images --format "  {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep -E "^  (todo-|audit-|notification-|recurring-|websocket-)" || true
}

# ---- Main ----
main() {
  echo "============================================="
  echo "  Todo App - Build Docker Images"
  echo "============================================="
  echo ""

  setup_docker_env
  build_all

  echo ""
  echo "Next step:"
  echo "  Deploy the app:  ./deploy.sh"
  echo ""
}

main "$@"
