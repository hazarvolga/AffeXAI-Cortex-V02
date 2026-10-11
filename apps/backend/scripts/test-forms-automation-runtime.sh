#!/bin/sh
# Requires the isolated G0 database/network and the running acceptance backend.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
BACKEND_IMAGE=${BACKEND_IMAGE:-affexai-cortex-backend:g0-local}
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{ index .Config.Labels "com.affexai.acceptance" }}' affexai-g1-app-smoke)" = g1 ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g1-app-smoke)" = true ]
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
  -e FORMS_AUTOMATION_ISOLATED=1 \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-forms-automation-runtime.cjs,dst=/app/apps/backend/test-forms-automation-runtime.cjs,readonly" \
  "$BACKEND_IMAGE" /app/apps/backend/test-forms-automation-runtime.cjs
