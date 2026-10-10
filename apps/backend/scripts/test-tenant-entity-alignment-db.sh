#!/bin/sh
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{range $key, $value := .HostConfig.Tmpfs}}{{$key}}{{end}}' affexai-g0-isolated-postgres-test-1)" = /var/lib/postgresql/data ]
ALIGNMENT_BUILD_DIR=$(mktemp -d)
trap 'rm -rf "$ALIGNMENT_BUILD_DIR"' EXIT HUP INT TERM
export ALIGNMENT_BUILD_DIR
node <<'JS'
const fs=require('node:fs');const ts=require('./apps/backend/node_modules/typescript');
fs.writeFileSync(process.env.ALIGNMENT_BUILD_DIR+'/migration.js',ts.transpileModule(fs.readFileSync('apps/backend/src/core/database/migrations/1791396000000-TenantEntityAlignment.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText);
JS
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node -e G3_ALIGNMENT_ISOLATED=1 \
 --mount "type=bind,src=$ALIGNMENT_BUILD_DIR,dst=/app/apps/backend/g3-alignment,readonly" \
 --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-tenant-entity-alignment-db.cjs,dst=/app/apps/backend/test-tenant-entity-alignment-db.cjs,readonly" \
 affexai-cortex-backend:g0-local /app/apps/backend/test-tenant-entity-alignment-db.cjs
