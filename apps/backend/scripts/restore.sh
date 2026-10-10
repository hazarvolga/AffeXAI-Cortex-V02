#!/bin/bash
# Database Restore Script
# Usage: ./restore.sh backup_YYYYMMDD_HHMMSS.sql

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not specified"
    echo "Usage: ./restore.sh backup_YYYYMMDD_HHMMSS.sql"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"
echo "⚠️  This will OVERWRITE the current database!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo "🗄️  Dropping existing database..."
docker exec affexai-postgres psql -U postgres -c "DROP DATABASE IF EXISTS affexai_dev;"

echo "🆕 Creating fresh database..."
docker exec affexai-postgres psql -U postgres -c "CREATE DATABASE affexai_dev;"

echo "📥 Restoring from backup..."
docker exec -i affexai-postgres psql -U postgres -d affexai_dev < "$BACKUP_FILE"

echo "✅ Database restored successfully!"
echo "📊 Verifying..."
docker exec affexai-postgres psql -U postgres -d affexai_dev -c "\dt" | head -20
