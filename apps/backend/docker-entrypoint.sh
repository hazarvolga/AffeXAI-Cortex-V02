#!/bin/sh
set -eu

# Default production startup runs migrations. RUN_MIGRATIONS=false is an explicit
# opt-out for isolated image smoke checks; it does not verify database readiness.
case "${RUN_MIGRATIONS:-true}" in
    true)
        MIGRATION_CLI=apps/backend/dist/core/database/cli.js
        if [ ! -f "$MIGRATION_CLI" ]; then
            echo "Migration CLI missing: $MIGRATION_CLI" >&2
            exit 1
        fi
        echo "Running database migrations..."
        if node "$MIGRATION_CLI"; then
            echo "Migrations completed successfully"
        else
            MIGRATION_EXIT_CODE=$?
            echo "Migration failed with exit code: $MIGRATION_EXIT_CODE" >&2
            exit "$MIGRATION_EXIT_CODE"
        fi
        ;;
    false)
        echo "Database migrations explicitly disabled (RUN_MIGRATIONS=false)"
        ;;
    *)
        echo "RUN_MIGRATIONS must be true or false" >&2
        exit 1
        ;;
esac

echo "Starting application..."
exec "$@"
