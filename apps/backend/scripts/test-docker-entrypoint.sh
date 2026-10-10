#!/bin/sh
# Isolated startup contract: fake node only; never connects to a database.
set -eu
ENTRYPOINT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/docker-entrypoint.sh
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT HUP INT TERM
mkdir -p "$TEST_ROOT/bin" "$TEST_ROOT/apps/backend/dist/core/database"
cat > "$TEST_ROOT/bin/node" <<'NODE'
#!/bin/sh
printf '%s\n' "$*" >> "$CALL_LOG"
exit "${FAKE_MIGRATION_STATUS:-0}"
NODE
cat > "$TEST_ROOT/bin/application" <<'APP'
#!/bin/sh
printf 'application:%s\n' "$*" >> "$CALL_LOG"
exit "${FAKE_APPLICATION_STATUS:-0}"
APP
chmod +x "$TEST_ROOT/bin/node" "$TEST_ROOT/bin/application"
export PATH="$TEST_ROOT/bin:$PATH" CALL_LOG="$TEST_ROOT/calls"
cd "$TEST_ROOT"
fail() { echo "FAIL: $*" >&2; exit 1; }
run() {
    : > "$CALL_LOG"
    STATUS=0
    sh "$ENTRYPOINT" application "argument with spaces" > "$TEST_ROOT/output" 2>&1 || STATUS=$?
}
: > apps/backend/dist/core/database/cli.js
unset RUN_MIGRATIONS
run
[ "$STATUS" -eq 0 ] || fail 'normal startup failed'
[ "$(sed -n '1p' "$CALL_LOG")" = 'apps/backend/dist/core/database/cli.js' ] || fail 'compiled migration CLI not invoked first'
[ "$(sed -n '2p' "$CALL_LOG")" = 'application:argument with spaces' ] || fail 'child argument was not preserved'
rm apps/backend/dist/core/database/cli.js
run
[ "$STATUS" -ne 0 ] || fail 'missing CLI must stop startup'
[ ! -s "$CALL_LOG" ] || fail 'child ran despite missing CLI'
: > apps/backend/dist/core/database/cli.js
export FAKE_MIGRATION_STATUS=23
run
[ "$STATUS" -eq 23 ] || fail 'migration failure status not preserved'
[ "$(wc -l < "$CALL_LOG" | tr -d ' ')" -eq 1 ] || fail 'child ran after migration failure'
unset FAKE_MIGRATION_STATUS
export FAKE_APPLICATION_STATUS=17
run
[ "$STATUS" -eq 17 ] || fail 'application exit status not preserved'
unset FAKE_APPLICATION_STATUS
rm apps/backend/dist/core/database/cli.js
export RUN_MIGRATIONS=false
run
[ "$STATUS" -eq 0 ] || fail 'explicit isolated smoke bypass failed'
[ "$(cat "$CALL_LOG")" = 'application:argument with spaces' ] || fail 'bypass must invoke only the child'
export RUN_MIGRATIONS=typo
run
[ "$STATUS" -ne 0 ] || fail 'invalid migration switch must fail closed'
[ ! -s "$CALL_LOG" ] || fail 'invalid switch invoked child'
echo 'PASS: migration startup ordering, missing CLI, failure propagation, child status, explicit bypass, invalid switch'
