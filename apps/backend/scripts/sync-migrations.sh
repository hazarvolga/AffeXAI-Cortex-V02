#!/bin/sh
set -e

# ============================================
# Sync Migration State with Existing Schema
# ============================================
# This script marks all existing migrations as
# executed in the production database.
#
# Run this once when deploying to a database
# that already has tables but missing migration
# records.
# ============================================

echo "🔄 Syncing migration state with database schema..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL configured"

# Check if psql is available
if ! command -v psql > /dev/null 2>&1; then
    echo "❌ ERROR: psql command not found. Installing..."
    apk add --no-cache postgresql-client
fi

# Execute the SQL script
echo "🚀 Marking all migrations as executed..."
psql "$DATABASE_URL" -f /app/apps/backend/mark-migrations-executed.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration state synchronized successfully"
    echo ""
    echo "📊 Summary:"
    psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM migrations;" | xargs echo "Total migrations recorded:"
    echo ""
    echo "Next deployment will only run new migrations."
else
    echo "❌ Failed to sync migration state"
    exit 1
fi
