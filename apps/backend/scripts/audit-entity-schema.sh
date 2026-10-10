#!/bin/sh
# Inspect only the already-authorized ephemeral G0 DB; never start Nest or load project .env.
set -eu
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
[ "$(docker inspect --format '{{ index .Config.Labels "com.affexai.acceptance" }}' affexai-g1-app-smoke)" = g1 ]
[ "$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' affexai-g0-isolated-postgres-test-1)" = affexai-g0-isolated ]
[ "$(docker inspect --format '{{range $key, $value := .HostConfig.Tmpfs}}{{$key}}{{end}}' affexai-g0-isolated-postgres-test-1)" = /var/lib/postgresql/data ]
docker exec -i -w /app/apps/backend -e G3_SCHEMA_AUDIT_ISOLATED=1 -e DOTENV_CONFIG_PATH=/dev/null affexai-g1-app-smoke node < "$REPO_ROOT/apps/backend/scripts/audit-entity-schema.cjs"
