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
for(const [input,output]of [['modules/notifications/notifications.service.ts','service.js'],['modules/notifications/entities/notification.entity.ts','entity.js']])fs.writeFileSync(process.env.NOTIFICATION_BUILD_DIR+'/'+output,ts.transpileModule(fs.readFileSync('apps/backend/src/'+input,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true,emitDecoratorMetadata:true}}).outputText);
JS
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node -e G3_NOTIFICATION_SERVICE_ISOLATED=1 -e DATABASE_HOST=postgres-test -e DATABASE_PORT=5432 -e DATABASE_USERNAME=g0_test -e DATABASE_PASSWORD=g0_ephemeral_local_only -e DATABASE_NAME=affexai_g0_ephemeral \
 --mount "type=bind,src=$NOTIFICATION_BUILD_DIR/service.js,dst=/app/apps/backend/dist/modules/notifications/notifications.service.js,readonly" \
 --mount "type=bind,src=$NOTIFICATION_BUILD_DIR/entity.js,dst=/app/apps/backend/dist/modules/notifications/entities/notification.entity.js,readonly" \
 --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-notification-service-db.cjs,dst=/app/apps/backend/test-notification-service-db.cjs,readonly" \
 affexai-cortex-backend:g0-local /app/apps/backend/test-notification-service-db.cjs
