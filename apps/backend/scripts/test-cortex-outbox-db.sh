#!/bin/sh
# Only the already-authorized ephemeral G0 database; never load .env or bootstrap Nest.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$REPO_ROOT"
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{.State.Running}}' affexai-g0-isolated-postgres-test-1)" = true ]
[ "$(docker inspect --format '{{range $key, $value := .HostConfig.Tmpfs}}{{$key}}{{end}}' affexai-g0-isolated-postgres-test-1)" = /var/lib/postgresql/data ]
OUTBOX_BUILD_DIR=$(mktemp -d)
OUTBOX_RESTART_APP=0
cleanup_outbox_fixture() {
  rm -rf "$OUTBOX_BUILD_DIR"
  if [ "$OUTBOX_RESTART_APP" = 1 ]; then docker start affexai-g1-app-smoke >/dev/null; fi
}
trap cleanup_outbox_fixture EXIT
trap 'exit 130' HUP INT TERM
# The acceptance app runs its own scheduler. Quiesce only our labelled app so
# its worker cannot consume rows belonging to this concurrency test.
if [ "$(docker inspect --format '{{.State.Running}}' affexai-g1-app-smoke 2>/dev/null || true)" = true ]; then
  [ "$(docker inspect --format '{{ index .Config.Labels "com.affexai.acceptance" }}' affexai-g1-app-smoke)" = g1 ]
  OUTBOX_RESTART_APP=1
  docker stop affexai-g1-app-smoke >/dev/null
fi
export OUTBOX_BUILD_DIR
node <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const ts = require('./apps/backend/node_modules/typescript');
const files = ['core/cortex/cortex-outbox.service.ts', 'core/cortex/cortex-outbox.worker.ts', 'core/cortex/delivery.ts', 'core/cortex/signed-request.ts', 'modules/platform-integration/entities/platform-event.entity.ts', 'core/database/entities/base.entity.ts', 'core/database/migration-catalog.ts', 'core/database/migrations/1771006556552-InitialSchema.ts', 'core/database/migrations/1771008872029-AddBccSignals.ts', 'core/database/migrations/1771009842032-AddFormsTable.ts', 'database/migrations/1771449820476-CreateCommerceTables.ts', 'database/migrations/1771449820477-AddMetadataToUsageRecord.ts', 'core/database/migrations/1791374400000-SubscriberTenantEmailUnique.ts', 'core/database/migrations/1791378000000-CortexOutbox.ts', 'core/database/migrations/1791381600000-TicketAttachments.ts', 'core/database/migrations/1791385200000-TicketCsatTenantScope.ts', 'core/database/migrations/1791388800000-KnowledgeBaseTenantScope.ts', 'core/database/migrations/1791392400000-TicketSystemNotes.ts', 'core/database/migrations/1791396000000-TenantEntityAlignment.ts', 'core/database/migrations/1791399600000-NotificationRecipientIntegrity.ts', 'core/database/migrations/1791403200000-KnowledgeCategoryMapping.ts', 'core/database/migrations/1791406800000-OrganizationLifecycle.ts', 'core/database/migrations/1791410400000-CommerceSubscriptionIntegrity.ts', 'core/database/migrations/1791414000000-UserTenantEmailIntegrity.ts', 'core/database/migrations/1791417600000-TenantAdminPermissions.ts', 'core/database/migrations/1791421200000-UserPrimaryRoleIntegrity.ts', 'core/database/migrations/1791424800000-SettingsScopeIntegrity.ts', 'core/database/migrations/1791428400000-CrmTenantIntegrity.ts', 'core/database/migrations/1791432000000-FormsLifecycleIntegrity.ts', 'core/database/migrations/1791435600000-AutomationDispatchOutbox.ts', 'core/database/migrations/1791439200000-AutomationApprovalPermission.ts', 'core/database/migrations/1791442800000-AutomationActionLeaseToken.ts'];
for (const file of files) {
  const target = path.join(process.env.OUTBOX_BUILD_DIR, file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, ts.transpileModule(fs.readFileSync(path.join('apps/backend/src', file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText);
}
JS
docker run --rm --network affexai-g0-isolated_g0-private --entrypoint node \
  -e G2_OUTBOX_ISOLATED=1 \
  --mount "type=bind,src=$OUTBOX_BUILD_DIR,dst=/app/apps/backend/g2-outbox,readonly" \
  --mount "type=bind,src=$REPO_ROOT/apps/backend/scripts/test-cortex-outbox-db.cjs,dst=/app/apps/backend/test-cortex-outbox-db.cjs,readonly" \
  affexai-cortex-backend:g0-local /app/apps/backend/test-cortex-outbox-db.cjs
