#!/bin/sh
# Only the already-authorized ephemeral G0 database; never load .env or bootstrap Nest.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g0-isolated-postgres-test-1)" = true ]
[ "$(docker inspect --format '{{range $key, $value := .HostConfig.Tmpfs}}{{$key}}{{end}}' affexai-g0-isolated-postgres-test-1)" = /var/lib/postgresql/data ]
SUBSCRIBER_BUILD_DIR=$(mktemp -d)
trap 'rm -rf "$SUBSCRIBER_BUILD_DIR"' EXIT HUP INT TERM
export SUBSCRIBER_BUILD_DIR
node <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const ts = require('./apps/backend/node_modules/typescript');
const files = ['modules/email-marketing/subscriber.service.ts', 'modules/email-marketing/group.service.ts', 'modules/email-marketing/segment.service.ts', 'modules/email-marketing/recipient-input-policy.ts', 'modules/email-marketing/entities/subscriber.entity.ts', 'modules/email-marketing/entities/group.entity.ts', 'modules/email-marketing/entities/segment.entity.ts', 'core/database/entities/base.entity.ts', 'core/database/migration-catalog.ts', 'core/database/migrations/1771006556552-InitialSchema.ts', 'core/database/migrations/1771008872029-AddBccSignals.ts', 'core/database/migrations/1771009842032-AddFormsTable.ts', 'database/migrations/1771449820476-CreateCommerceTables.ts', 'database/migrations/1771449820477-AddMetadataToUsageRecord.ts', 'core/database/migrations/1791374400000-SubscriberTenantEmailUnique.ts', 'core/database/migrations/1791378000000-CortexOutbox.ts', 'core/database/migrations/1791381600000-TicketAttachments.ts', 'core/database/migrations/1791385200000-TicketCsatTenantScope.ts', 'core/database/migrations/1791388800000-KnowledgeBaseTenantScope.ts', 'core/database/migrations/1791392400000-TicketSystemNotes.ts', 'core/database/migrations/1791396000000-TenantEntityAlignment.ts', 'core/database/migrations/1791399600000-NotificationRecipientIntegrity.ts', 'core/database/migrations/1791403200000-KnowledgeCategoryMapping.ts'];
for (const file of files) {
  const target = path.join(process.env.SUBSCRIBER_BUILD_DIR, file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, ts.transpileModule(fs.readFileSync(path.join('apps/backend/src', file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText);
}
JS
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
  -e G1_SUBSCRIBER_ISOLATED=1 \
  --mount "type=bind,src=$SUBSCRIBER_BUILD_DIR,dst=/app/apps/backend/g1-subscriber,readonly" \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-subscriber-tenant-db.cjs,dst=/app/apps/backend/test-subscriber-tenant-db.cjs,readonly" \
  affexai-cortex-backend:g0-local /app/apps/backend/test-subscriber-tenant-db.cjs
