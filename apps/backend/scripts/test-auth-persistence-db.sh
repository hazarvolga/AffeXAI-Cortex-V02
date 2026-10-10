#!/bin/sh
# Requires the explicitly authorized, already running G0 ephemeral PostgreSQL service.
# Does not start any service, reuse another database, or bootstrap the application.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g0-isolated-postgres-test-1)" = true ]
docker network inspect affexai-g0-isolated_g0-private >/dev/null
CAS_BUILD_DIR=$(mktemp -d)
trap 'rm -rf "$CAS_BUILD_DIR"' EXIT HUP INT TERM
export CAS_BUILD_DIR
node <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const ts = require('./apps/backend/node_modules/typescript');
const source = fs.readFileSync('apps/backend/src/modules/users/auth-persistence.ts', 'utf8');
fs.writeFileSync(path.join(process.env.CAS_BUILD_DIR, 'auth-persistence.js'), ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
JS
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
  -e G1_CAS_ISOLATED=1 \
  -e AUTH_PERSISTENCE_MODULE=/app/apps/backend/g1-cas/auth-persistence.js \
  --mount "type=bind,src=$CAS_BUILD_DIR,dst=/app/apps/backend/g1-cas,readonly" \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-auth-persistence-db.cjs,dst=/app/apps/backend/g1-cas-test.cjs,readonly" \
  affexai-cortex-backend:g0-local /app/apps/backend/g1-cas-test.cjs
