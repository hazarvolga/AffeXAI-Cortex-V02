#!/bin/sh
# Proves a DB-backed dispatch is recovered after the isolated application restarts.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
BACKEND_IMAGE=${BACKEND_IMAGE:-affexai-cortex-backend:g0-local}
STATE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/affexai-automation-restart.XXXXXX")
MANAGED_CONTAINER=0

run_fixture() {
  docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
    --user "$(id -u):$(id -g)" \
    -e FORMS_AUTOMATION_ISOLATED=1 \
    --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-automation-restart-runtime.cjs,dst=/app/apps/backend/test-automation-restart-runtime.cjs,readonly" \
    --mount "type=bind,src=$STATE_DIR,dst=/state" \
    "$BACKEND_IMAGE" /app/apps/backend/test-automation-restart-runtime.cjs "$1"
}

cleanup() {
  original_status=$?
  trap - EXIT INT TERM
  if [ "$MANAGED_CONTAINER" -eq 1 ]; then docker stop -t 5 affexai-g1-app-smoke >/dev/null 2>&1 || true; fi
  cleanup_failed=0
  if [ -f "$STATE_DIR/automation-restart.json" ]; then
    if ! run_fixture cleanup; then cleanup_failed=1; fi
  fi
  if [ "$MANAGED_CONTAINER" -eq 1 ]; then docker start affexai-g1-app-smoke >/dev/null 2>&1 || true; fi
  if [ "$cleanup_failed" -eq 1 ]; then
    echo "Automation fixture cleanup failed; recovery state retained at $STATE_DIR" >&2
    exit 1
  fi
  rm -rf "$STATE_DIR"
  exit "$original_status"
}
trap cleanup EXIT INT TERM

[ "$(docker inspect --format '{{ index .Config.Labels "com.affexai.acceptance" }}' affexai-g1-app-smoke)" = g1 ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g1-app-smoke)" = true ]
MANAGED_CONTAINER=1
docker stop -t 10 affexai-g1-app-smoke >/dev/null
run_fixture seed
docker start affexai-g1-app-smoke >/dev/null
attempt=0
until docker exec affexai-g1-app-smoke node -e "fetch('http://127.0.0.1:9006/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then echo 'Restarted backend did not become ready' >&2; exit 1; fi
  sleep 1
done
run_fixture verify
