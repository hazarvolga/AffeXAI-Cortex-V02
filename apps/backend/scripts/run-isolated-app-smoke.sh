#!/bin/sh
# Uses only the existing disposable G0 database and network; never reads .env.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g0-isolated-postgres-test-1)" = true ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g0-isolated-redis-test-1)" = true ]
[ -f apps/backend/dist/main.js ]
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/dist,dst=/app/apps/backend/dist,readonly" \
  -e NODE_ENV=production \
  -e DATABASE_HOST=postgres-test -e DATABASE_PORT=5432 -e DATABASE_USERNAME=g0_test \
  -e DATABASE_PASSWORD=g0_ephemeral_local_only -e DATABASE_NAME=affexai_g0_ephemeral \
  affexai-cortex-backend:g1-local apps/backend/dist/core/database/cli.js
if docker inspect affexai-g1-app-smoke >/dev/null 2>&1; then
  [ "$(docker inspect --format '{{ index .Config.Labels "com.affexai.acceptance" }}' affexai-g1-app-smoke)" = g1 ]
  docker rm -f affexai-g1-app-smoke >/dev/null
fi
docker run -d --name affexai-g1-app-smoke --label com.affexai.acceptance=g1 \
  --network affexai-g0-isolated_g0-private --entrypoint node \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/dist,dst=/app/apps/backend/dist,readonly" \
  -e NODE_ENV=production -e PORT=9006 \
  -e DATABASE_HOST=postgres-test -e DATABASE_PORT=5432 -e DATABASE_USERNAME=g0_test \
  -e DATABASE_PASSWORD=g0_ephemeral_local_only -e DATABASE_NAME=affexai_g0_ephemeral \
  -e REDIS_HOST=redis-test -e REDIS_PORT=6379 \
  -e JWT_SECRET=isolated-local-acceptance-secret-never-for-deployment \
  -e CORTEX_SERVICE_SECRET=isolated-cortex-service-secret-never-for-deployment \
  -e PLATFORM_ADMIN_USER_IDS=7f9b2f7c-5ec4-4a67-8424-f0d20e89a693 \
  -e CORTEX_URL=http://cortex-test:8000 -e QDRANT_URL=http://qdrant-test:6333 \
  -e FRONTEND_URL=http://127.0.0.1:9003 -e NEXT_PUBLIC_BASE_URL=http://127.0.0.1:9003 \
  affexai-cortex-backend:g1-local apps/backend/dist/main.js >/dev/null
attempt=0
until docker exec affexai-g1-app-smoke node -e "fetch('http://127.0.0.1:9006/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then echo 'Isolated backend did not become ready' >&2; exit 1; fi
  sleep 1
done
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
  -e G1_FULLAPP_ISOLATED=1 \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-fullapp-auth.cjs,dst=/app/apps/backend/test-fullapp-auth.cjs,readonly" \
  affexai-cortex-backend:g1-local /app/apps/backend/test-fullapp-auth.cjs
