#!/bin/sh
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{range $key, $value := .HostConfig.Tmpfs}}{{$key}}{{end}}' affexai-g0-isolated-postgres-test-1)" = /var/lib/postgresql/data ]
NOTIFICATION_BUILD_DIR=$(mktemp -d)
trap 'rm -rf "$NOTIFICATION_BUILD_DIR"' EXIT HUP INT TERM
export NOTIFICATION_BUILD_DIR
node <<'JS'
const fs=require('node:fs');const ts=require('./apps/backend/node_modules/typescript');
fs.writeFileSync(process.env.NOTIFICATION_BUILD_DIR+'/migration.js',ts.transpileModule(fs.readFileSync('apps/backend/src/core/database/migrations/1791399600000-NotificationRecipientIntegrity.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText);
JS
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node -e G3_NOTIFICATION_ISOLATED=1 -e G3_NOTIFICATION_APPLY="${G3_NOTIFICATION_APPLY:-0}" \
 --mount "type=bind,src=$NOTIFICATION_BUILD_DIR,dst=/app/apps/backend/g3-notification,readonly" \
 --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-notification-recipient-db.cjs,dst=/app/apps/backend/test-notification-recipient-db.cjs,readonly" \
 affexai-cortex-backend:g0-local /app/apps/backend/test-notification-recipient-db.cjs
