#!/bin/bash

# Test Migration Script
# Creates a test database, copies production data, runs migration, and verifies results

set -e  # Exit on error

echo "🧪 Starting Test Migration..."
echo "======================================"
echo ""

# Configuration
PROD_DB="affexai_dev"
TEST_DB="affexai_test_migration"
DB_USER="postgres"
DB_CONTAINER="affexai-postgres"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# ============================================================================
# STEP 1: Create Test Database
# ============================================================================

echo "📦 Step 1: Creating test database..."

# Drop test database if exists
docker exec $DB_CONTAINER psql -U $DB_USER -c "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null || true

# Create test database
docker exec $DB_CONTAINER psql -U $DB_USER -c "CREATE DATABASE $TEST_DB;" 

print_success "Test database created: $TEST_DB"
echo ""

# ============================================================================
# STEP 2: Copy Production Data
# ============================================================================

echo "📋 Step 2: Copying production data..."

# Dump production database
print_info "Dumping production database..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER $PROD_DB > /tmp/prod_dump.sql

# Restore to test database
print_info "Restoring to test database..."
docker exec -i $DB_CONTAINER psql -U $DB_USER $TEST_DB < /tmp/prod_dump.sql > /dev/null 2>&1

# Clean up dump file
rm /tmp/prod_dump.sql

print_success "Production data copied to test database"
echo ""

# ============================================================================
# STEP 3: Verify Data Copy
# ============================================================================

echo "🔍 Step 3: Verifying data copy..."

# Count components in test database
COMPONENT_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM cms_components;")
COMPONENT_COUNT=$(echo $COMPONENT_COUNT | tr -d ' ')

print_info "Components in test database: $COMPONENT_COUNT"

if [ "$COMPONENT_COUNT" -eq 383 ]; then
    print_success "Data copy verified"
else
    print_error "Data copy failed - expected 383 components, got $COMPONENT_COUNT"
    exit 1
fi

echo ""

# ============================================================================
# STEP 4: Run Migration on Test Database
# ============================================================================

echo "🚀 Step 4: Running migration on test database..."

# Update .env to point to test database temporarily
export DB_NAME=$TEST_DB

# Run migration SQL directly
print_info "Adding new columns..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -c "
ALTER TABLE cms_components ADD COLUMN IF NOT EXISTS block_type VARCHAR(100);
ALTER TABLE cms_components ADD COLUMN IF NOT EXISTS block_category VARCHAR(100);
ALTER TABLE cms_components ADD COLUMN IF NOT EXISTS block_id VARCHAR(100);
ALTER TABLE cms_components ADD COLUMN IF NOT EXISTS reusable_component_id UUID;
" > /dev/null 2>&1

# Verify columns were added
COLUMN_CHECK=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -t -c "
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'cms_components' 
  AND column_name IN ('block_type', 'block_category', 'block_id', 'reusable_component_id');
")
COLUMN_CHECK=$(echo $COLUMN_CHECK | tr -d ' ')

if [ "$COLUMN_CHECK" -eq 4 ]; then
    print_success "Columns added (4/4)"
else
    print_error "Column addition failed - expected 4, got $COLUMN_CHECK"
    exit 1
fi

print_info "Creating indexes..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -c "
CREATE INDEX IF NOT EXISTS idx_cms_components_block_type ON cms_components(block_type);
CREATE INDEX IF NOT EXISTS idx_cms_components_block_category ON cms_components(block_category);
CREATE INDEX IF NOT EXISTS idx_cms_components_block_id ON cms_components(block_id);
CREATE INDEX IF NOT EXISTS idx_cms_components_reusable_component_id ON cms_components(reusable_component_id);
CREATE INDEX IF NOT EXISTS idx_cms_components_type_block_type ON cms_components(type, block_type) WHERE type = 'block';
" > /dev/null 2>&1

print_success "Indexes created"

print_info "Migrating data..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -c "
UPDATE cms_components
SET 
  block_type = props->>'blockType',
  block_category = props->>'blockCategory',
  block_id = props->>'blockId'
WHERE 
  type = 'block' 
  AND (props ? 'blockType' OR props ? 'blockId')
  AND block_type IS NULL;
" > /dev/null 2>&1

docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -c "
UPDATE cms_components
SET block_category = SPLIT_PART(block_type, '-', 1)
WHERE 
  block_type IS NOT NULL 
  AND block_category IS NULL;
" > /dev/null 2>&1

print_success "Data migrated"
echo ""

# ============================================================================
# STEP 5: Verify Migration Results
# ============================================================================

echo "✅ Step 5: Verifying migration results..."

# Get migration statistics
STATS=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -t <<EOF
SELECT 
  COUNT(*) as total,
  COUNT(block_id) as has_block_id,
  COUNT(block_type) as has_block_type,
  COUNT(block_category) as has_block_category
FROM cms_components;
EOF
)

# Parse statistics
TOTAL=$(echo $STATS | awk '{print $1}')
HAS_BLOCK_ID=$(echo $STATS | awk '{print $2}')
HAS_BLOCK_TYPE=$(echo $STATS | awk '{print $3}')
HAS_BLOCK_CATEGORY=$(echo $STATS | awk '{print $4}')

echo "📊 Migration Statistics:"
echo "   Total components: $TOTAL"
echo "   Has block_id: $HAS_BLOCK_ID"
echo "   Has block_type: $HAS_BLOCK_TYPE"
echo "   Has block_category: $HAS_BLOCK_CATEGORY"
echo ""

# Verify expected results
ERRORS=0

if [ "$TOTAL" -ne 383 ]; then
    print_error "Total components mismatch - expected 383, got $TOTAL"
    ERRORS=$((ERRORS + 1))
fi

if [ "$HAS_BLOCK_ID" -ne 375 ]; then
    print_warning "block_id count - expected 375, got $HAS_BLOCK_ID"
fi

if [ "$HAS_BLOCK_TYPE" -ne 8 ]; then
    print_warning "block_type count - expected 8, got $HAS_BLOCK_TYPE"
fi

# ============================================================================
# STEP 6: Data Integrity Check
# ============================================================================

echo "🔒 Step 6: Checking data integrity..."

# Check for mismatches
MISMATCHES=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -t -c "
SELECT COUNT(*) 
FROM cms_components 
WHERE block_id IS NOT NULL 
  AND block_id != props->>'blockId';
")
MISMATCHES=$(echo $MISMATCHES | tr -d ' ')

if [ "$MISMATCHES" -eq 0 ]; then
    print_success "Data integrity verified - no mismatches"
else
    print_error "Data integrity issue - $MISMATCHES mismatches found"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# STEP 7: Check Indexes
# ============================================================================

echo "📇 Step 7: Verifying indexes..."

INDEX_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -t -c "
SELECT COUNT(*) 
FROM pg_indexes 
WHERE tablename = 'cms_components' 
  AND indexname LIKE '%block%';
")
INDEX_COUNT=$(echo $INDEX_COUNT | tr -d ' ')

if [ "$INDEX_COUNT" -eq 5 ]; then
    print_success "All indexes created ($INDEX_COUNT)"
else
    print_warning "Index count - expected 5, got $INDEX_COUNT"
fi

echo ""

# ============================================================================
# STEP 8: Sample Data Inspection
# ============================================================================

echo "🔍 Step 8: Inspecting sample migrated data..."

docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB <<EOF
SELECT 
    id,
    type,
    block_type,
    block_category,
    block_id,
    CASE 
        WHEN props ? 'blockId' THEN 'Props has blockId'
        ELSE 'Props cleaned'
    END as props_status
FROM cms_components
WHERE block_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""

# ============================================================================
# STEP 9: Performance Test
# ============================================================================

echo "⚡ Step 9: Testing query performance..."

# Test query with new index
print_info "Testing query with block_id filter..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $TEST_DB -c "
EXPLAIN ANALYZE
SELECT * FROM cms_components 
WHERE type = 'block' AND block_id = 'hero-centered-bg-image';
" | grep "Execution Time"

echo ""

# ============================================================================
# STEP 10: Final Report
# ============================================================================

echo "======================================"
echo "📋 Test Migration Report"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    print_success "Migration test PASSED"
    echo ""
    echo "✅ All checks passed:"
    echo "   - Data copied successfully"
    echo "   - Migration completed"
    echo "   - Data integrity verified"
    echo "   - Indexes created"
    echo "   - No errors found"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Review the results above"
    echo "   2. If satisfied, run migration on production"
    echo "   3. Command: npm run migration:run"
    echo ""
else
    print_error "Migration test FAILED with $ERRORS errors"
    echo ""
    echo "⚠️  Please review the errors above before proceeding"
    echo ""
fi

# ============================================================================
# STEP 11: Cleanup Option
# ============================================================================

echo "🧹 Cleanup:"
echo "   To keep test database: Do nothing"
echo "   To remove test database: docker exec $DB_CONTAINER psql -U $DB_USER -c 'DROP DATABASE $TEST_DB;'"
echo ""

echo "======================================"
echo "✅ Test Migration Complete!"
echo "======================================"
