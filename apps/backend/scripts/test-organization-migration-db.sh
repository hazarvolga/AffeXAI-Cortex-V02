#!/bin/sh
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
if docker inspect affexai-g1-app-smoke >/dev/null 2>&1; then docker rm -f affexai-g1-app-smoke >/dev/null; fi
docker run --rm --network affexai-g0-isolated_g0-private --workdir /app/apps/backend --entrypoint node \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/dist,dst=/app/apps/backend/dist,readonly" \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-organization-migration-db.cjs,dst=/app/apps/backend/test-organization-migration-db.cjs,readonly" \
  -e ORGANIZATION_MIGRATION_ISOLATED=1 \
  -e DATABASE_HOST=postgres-test -e DATABASE_PORT=5432 -e DATABASE_USERNAME=g0_test \
  -e DATABASE_PASSWORD=g0_ephemeral_local_only -e DATABASE_NAME=affexai_g0_ephemeral \
  affexai-cortex-backend:g1-local test-organization-migration-db.cjs
