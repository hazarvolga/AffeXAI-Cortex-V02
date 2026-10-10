#!/bin/bash
# Database restore script for rollback scenarios

set -e

# ============================================
# Configuration
# ============================================
BACKUP_FILE="$1"
TEMP_DIR="/tmp/affexai-restore"

# Database credentials from environment
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-affexai_prod}"
DB_USER="${DATABASE_USERNAME:-postgres}"

# ============================================
# Logging
# ============================================
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# ============================================
# Validation
# ============================================
if [ -z "$BACKUP_FILE" ]; then
  error "Usage: ./db-restore.sh <backup_file>"
  echo ""
  echo "Examples:"
  echo "  ./db-restore.sh /app/backups/postgres/affexai_prod_20251122_143000.sql.gz"
  echo "  ./db-restore.sh s3://affexai-backups/database/affexai_prod_20251122_143000.sql.gz"
  echo ""
  echo "Available local backups:"
  ls -lh /app/backups/postgres/affexai_prod_*.sql.gz 2>/dev/null | tail -10 || echo "  (none found)"
  echo ""
  echo "Available S3 backups (last 10):"
  aws s3 ls s3://affexai-backups/database/ --human-readable 2>/dev/null | grep affexai_prod | tail -10 || echo "  (AWS not configured or no backups)"
  exit 1
fi

# ============================================
# Safety Confirmation
# ============================================
log "⚠️  DATABASE RESTORE WARNING"
log "================================"
log "This will COMPLETELY REPLACE the current database:"
log "  Database: ${DB_NAME}"
log "  Host: ${DB_HOST}:${DB_PORT}"
log "  Backup: ${BACKUP_FILE}"
log ""
log "ALL CURRENT DATA WILL BE LOST!"
log "================================"
echo ""

read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  log "❌ Restore cancelled by user"
  exit 1
fi

# ============================================
# Pre-Restore Backup
# ============================================
log "📦 Creating safety backup of current database..."
SAFETY_BACKUP="/app/backups/postgres/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p /app/backups/postgres

PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -F c \
  -f "${SAFETY_BACKUP%.gz}"

gzip "${SAFETY_BACKUP%.gz}"

log "✅ Safety backup created: ${SAFETY_BACKUP}"

# ============================================
# Download/Prepare Backup File
# ============================================
mkdir -p "$TEMP_DIR"
RESTORE_FILE="$BACKUP_FILE"

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
  log "📥 Downloading from S3..."

  if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    error "AWS credentials not configured!"
    exit 1
  fi

  RESTORE_FILE="${TEMP_DIR}/restore.sql.gz"
  aws s3 cp "$BACKUP_FILE" "$RESTORE_FILE"

  if [ $? -ne 0 ]; then
    error "Failed to download from S3!"
    exit 1
  fi

  log "✅ Downloaded to ${RESTORE_FILE}"
fi

# Decompress if gzipped
if [[ "$RESTORE_FILE" == *.gz ]]; then
  log "🗜️  Decompressing backup..."
  gunzip -c "$RESTORE_FILE" > "${TEMP_DIR}/restore.sql"
  RESTORE_FILE="${TEMP_DIR}/restore.sql"
  log "✅ Decompressed"
fi

# ============================================
# Restore Database
# ============================================
log "🔄 Starting database restore..."
log "This may take several minutes for large databases..."

# Drop all connections to database
log "Terminating active connections..."
PGPASSWORD="$DATABASE_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# Restore database
PGPASSWORD="$DATABASE_PASSWORD" pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  "$RESTORE_FILE"

RESTORE_STATUS=$?

if [ $RESTORE_STATUS -ne 0 ]; then
  error "Database restore failed!"
  log "Rolling back to safety backup: ${SAFETY_BACKUP}"

  # Attempt to restore safety backup
  gunzip -c "$SAFETY_BACKUP" > "${TEMP_DIR}/safety_restore.sql"

  PGPASSWORD="$DATABASE_PASSWORD" pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    "${TEMP_DIR}/safety_restore.sql"

  error "Restore failed, rolled back to safety backup"
  exit 1
fi

log "✅ Database restored successfully"

# ============================================
# Post-Restore Validation
# ============================================
log "🔍 Validating restored database..."

# Check connection
PGPASSWORD="$DATABASE_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT 1;" > /dev/null

if [ $? -ne 0 ]; then
  error "Database connection test failed!"
  exit 1
fi

# Count tables
TABLE_COUNT=$(PGPASSWORD="$DATABASE_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

log "Tables restored: ${TABLE_COUNT}"

# Check key tables exist
CRITICAL_TABLES=("users" "pages" "tickets" "subscribers" "email_campaigns")
MISSING_TABLES=()

for table in "${CRITICAL_TABLES[@]}"; do
  EXISTS=$(PGPASSWORD="$DATABASE_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}');")

  if [[ "$EXISTS" != *"t"* ]]; then
    MISSING_TABLES+=("$table")
  fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
  error "Missing critical tables: ${MISSING_TABLES[*]}"
  error "Restore may be incomplete!"
  exit 1
fi

log "✅ All critical tables present"

# ============================================
# Cleanup
# ============================================
log "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
log "✅ Cleanup complete"

# ============================================
# Summary
# ============================================
log "================================"
log "✅ Database restore completed successfully"
log "Restored from: ${BACKUP_FILE}"
log "Tables: ${TABLE_COUNT}"
log "Safety backup (for rollback): ${SAFETY_BACKUP}"
log "================================"
log ""
log "⚠️  IMPORTANT NEXT STEPS:"
log "1. Restart application containers"
log "2. Run smoke tests"
log "3. Verify critical user flows"
log "4. Monitor logs for errors"
log "5. Keep safety backup for 24 hours"
