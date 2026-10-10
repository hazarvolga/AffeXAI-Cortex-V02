#!/bin/sh
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
docker run --rm --network affexai-g0-isolated_g0-private --workdir /app/apps/backend --entrypoint node \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-organization-lifecycle-http.cjs,dst=/app/apps/backend/test-organization-lifecycle-http.cjs,readonly" \
  -e ORGANIZATION_LIFECYCLE_ISOLATED=1 \
  affexai-cortex-backend:g1-local test-organization-lifecycle-http.cjs
