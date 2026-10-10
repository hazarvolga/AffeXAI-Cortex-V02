#!/bin/bash
# Database data integrity verification script

set -e

# ============================================
# Configuration
# ============================================
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
# SQL Query Helper
# ============================================
run_query() {
  PGPASSWORD="$DATABASE_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -c "$1"
}

# ============================================
# Verification Tests
# ============================================
FAILED_CHECKS=0

log "🔍 Starting data integrity verification..."
log "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
log ""

# ============================================
# 1. Connection Test
# ============================================
log "✓ Testing database connection..."
if ! run_query "SELECT 1;" > /dev/null 2>&1; then
  error "Cannot connect to database!"
  exit 1
fi
log "  ✅ Connection successful"

# ============================================
# 2. Critical Tables Existence
# ============================================
log ""
log "✓ Checking critical tables..."

CRITICAL_TABLES=(
  "users"
  "roles"
  "pages"
  "components"
  "tickets"
  "ticket_messages"
  "subscribers"
  "email_campaigns"
  "chat_sessions"
  "chat_messages"
  "certificates"
  "events"
  "settings"
)

MISSING_TABLES=()

for table in "${CRITICAL_TABLES[@]}"; do
  EXISTS=$(run_query "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}');")

  if [[ "$EXISTS" != *"t"* ]]; then
    MISSING_TABLES+=("$table")
    error "  ❌ Missing table: ${table}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
  log "  ✅ All ${#CRITICAL_TABLES[@]} critical tables exist"
else
  error "  ❌ Missing ${#MISSING_TABLES[@]} critical tables!"
fi

# ============================================
# 3. Row Count Validation
# ============================================
log ""
log "✓ Checking row counts..."

get_row_count() {
  run_query "SELECT COUNT(*) FROM $1;" | tr -d ' '
}

# Users (should have at least 1 admin)
USER_COUNT=$(get_row_count "users")
if [ "$USER_COUNT" -lt 1 ]; then
  error "  ❌ No users found in database!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ Users: ${USER_COUNT}"
fi

# Roles (should have default roles)
ROLE_COUNT=$(get_row_count "roles")
if [ "$ROLE_COUNT" -lt 5 ]; then
  error "  ❌ Expected at least 5 default roles, found ${ROLE_COUNT}"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ Roles: ${ROLE_COUNT}"
fi

# CMS Pages
PAGE_COUNT=$(get_row_count "pages")
log "  ✅ CMS Pages: ${PAGE_COUNT}"

# Tickets
TICKET_COUNT=$(get_row_count "tickets")
log "  ✅ Tickets: ${TICKET_COUNT}"

# Subscribers
SUBSCRIBER_COUNT=$(get_row_count "subscribers")
log "  ✅ Subscribers: ${SUBSCRIBER_COUNT}"

# ============================================
# 4. Foreign Key Constraints
# ============================================
log ""
log "✓ Checking foreign key constraints..."

INVALID_FK=$(run_query "
  SELECT COUNT(*)
  FROM pg_constraint
  WHERE contype = 'f' AND convalidated = false;
" | tr -d ' ')

if [ "$INVALID_FK" -gt 0 ]; then
  error "  ❌ Found ${INVALID_FK} invalid foreign key constraints!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))

  # List invalid constraints
  run_query "
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'f' AND convalidated = false;
  "
else
  log "  ✅ All foreign key constraints valid"
fi

# ============================================
# 5. Orphaned Records Check
# ============================================
log ""
log "✓ Checking for orphaned records..."

# Orphaned ticket messages (ticket deleted but messages remain)
ORPHANED_MESSAGES=$(run_query "
  SELECT COUNT(*)
  FROM ticket_messages tm
  LEFT JOIN tickets t ON tm.ticket_id = t.id
  WHERE t.id IS NULL;
" | tr -d ' ')

if [ "$ORPHANED_MESSAGES" -gt 0 ]; then
  error "  ❌ Found ${ORPHANED_MESSAGES} orphaned ticket messages!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ No orphaned ticket messages"
fi

# Orphaned chat messages (session deleted but messages remain)
ORPHANED_CHAT=$(run_query "
  SELECT COUNT(*)
  FROM chat_messages cm
  LEFT JOIN chat_sessions cs ON cm.session_id = cs.id
  WHERE cs.id IS NULL;
" | tr -d ' ')

if [ "$ORPHANED_CHAT" -gt 0 ]; then
  error "  ❌ Found ${ORPHANED_CHAT} orphaned chat messages!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ No orphaned chat messages"
fi

# ============================================
# 6. Index Validity
# ============================================
log ""
log "✓ Checking index validity..."

INVALID_INDEXES=$(run_query "
  SELECT COUNT(*)
  FROM pg_class c
  JOIN pg_index i ON i.indexrelid = c.oid
  WHERE c.relkind = 'i' AND NOT i.indisvalid;
" | tr -d ' ')

if [ "$INVALID_INDEXES" -gt 0 ]; then
  error "  ❌ Found ${INVALID_INDEXES} invalid indexes!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))

  # List invalid indexes
  run_query "
    SELECT c.relname AS index_name, t.relname AS table_name
    FROM pg_class c
    JOIN pg_index i ON i.indexrelid = c.oid
    JOIN pg_class t ON i.indrelid = t.oid
    WHERE c.relkind = 'i' AND NOT i.indisvalid;
  "
else
  log "  ✅ All indexes valid"
fi

# ============================================
# 7. Settings Table Check
# ============================================
log ""
log "✓ Checking settings configuration..."

SETTINGS_COUNT=$(get_row_count "settings")
if [ "$SETTINGS_COUNT" -lt 1 ]; then
  error "  ❌ No settings found in database!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ Settings: ${SETTINGS_COUNT} entries"
fi

# ============================================
# 8. CMS Data Integrity
# ============================================
log ""
log "✓ Checking CMS data integrity..."

# Published pages should have valid content
INVALID_PAGES=$(run_query "
  SELECT COUNT(*)
  FROM pages
  WHERE status = 'published' AND (content IS NULL OR content = '');
" | tr -d ' ')

if [ "$INVALID_PAGES" -gt 0 ]; then
  error "  ❌ Found ${INVALID_PAGES} published pages with empty content!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ All published pages have content"
fi

# ============================================
# 9. Email Campaign Data
# ============================================
log ""
log "✓ Checking email campaign data..."

# Campaigns should have valid subject lines
INVALID_CAMPAIGNS=$(run_query "
  SELECT COUNT(*)
  FROM email_campaigns
  WHERE subject IS NULL OR subject = '';
" | tr -d ' ')

if [ "$INVALID_CAMPAIGNS" -gt 0 ]; then
  error "  ❌ Found ${INVALID_CAMPAIGNS} campaigns with empty subjects!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ All campaigns have valid subjects"
fi

# ============================================
# 10. User Roles Assignment
# ============================================
log ""
log "✓ Checking user role assignments..."

# Users should have at least one role
USERS_WITHOUT_ROLES=$(run_query "
  SELECT COUNT(*)
  FROM users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  WHERE ur.role_id IS NULL;
" | tr -d ' ')

if [ "$USERS_WITHOUT_ROLES" -gt 0 ]; then
  error "  ❌ Found ${USERS_WITHOUT_ROLES} users without roles!"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
  log "  ✅ All users have assigned roles"
fi

# ============================================
# Summary
# ============================================
log ""
log "================================"

if [ "$FAILED_CHECKS" -eq 0 ]; then
  log "✅ Data integrity verification PASSED"
  log "All checks completed successfully"
  log "================================"
  exit 0
else
  error "❌ Data integrity verification FAILED"
  error "Failed checks: ${FAILED_CHECKS}"
  error "================================"
  error ""
  error "⚠️  DATABASE MAY BE CORRUPTED OR INCOMPLETE"
  error "Review errors above and fix before proceeding"
  exit 1
fi
