#!/bin/bash
# Database backup script for production deployment

set -e  # Exit on error

# ============================================
# Configuration
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/app/backups/postgres}"
S3_BUCKET="${S3_BACKUP_BUCKET:-s3://affexai-backups/database}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="affexai_prod_${TIMESTAMP}.sql"

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
# Backup Process
# ============================================
log "🗄️  Starting database backup..."
log "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
log "Timestamp: ${TIMESTAMP}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Full database dump
log "📦 Creating database dump..."
PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -F c \
  -f "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -ne 0 ]; then
  error "Database dump failed!"
  exit 1
fi

# Compress backup
log "🗜️  Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "✅ Backup created: ${BACKUP_FILE}"
log "Size: ${BACKUP_SIZE}"

# Upload to S3 (if AWS configured)
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  log "📤 Uploading to S3..."

  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "${S3_BUCKET}/${BACKUP_FILE}" \
    --storage-class STANDARD_IA \
    --metadata "timestamp=${TIMESTAMP},database=${DB_NAME},host=${DB_HOST}"

  if [ $? -eq 0 ]; then
    log "✅ Uploaded to S3: ${S3_BUCKET}/${BACKUP_FILE}"
  else
    error "S3 upload failed (backup still available locally)"
  fi
else
  log "⚠️  AWS credentials not configured, skipping S3 upload"
fi

# Cleanup old backups (keep last 7 days locally)
log "🧹 Cleaning up old local backups..."
find "$BACKUP_DIR" -name "affexai_prod_*.sql.gz" -mtime +7 -delete
log "Kept backups from last 7 days"

# Cleanup old S3 backups (keep last 30 days)
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  log "🧹 Cleaning up old S3 backups..."

  # List backups older than 30 days
  CUTOFF_DATE=$(date -d "30 days ago" +%Y%m%d 2>/dev/null || date -v-30d +%Y%m%d)

  aws s3 ls "${S3_BUCKET}/" | while read -r line; do
    BACKUP_DATE=$(echo "$line" | grep -oP 'affexai_prod_\K\d{8}' || echo "$line" | grep -o 'affexai_prod_[0-9]\{8\}' | cut -d_ -f3)
    BACKUP_NAME=$(echo "$line" | awk '{print $4}')

    if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
      log "Deleting old backup: ${BACKUP_NAME}"
      aws s3 rm "${S3_BUCKET}/${BACKUP_NAME}"
    fi
  done

  log "Kept S3 backups from last 30 days"
fi

# Summary
log "================================"
log "✅ Backup completed successfully"
log "Local path: ${BACKUP_DIR}/${BACKUP_FILE}"
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  log "S3 path: ${S3_BUCKET}/${BACKUP_FILE}"
fi
log "================================"

# Export backup path for use in other scripts
echo "${BACKUP_DIR}/${BACKUP_FILE}"
