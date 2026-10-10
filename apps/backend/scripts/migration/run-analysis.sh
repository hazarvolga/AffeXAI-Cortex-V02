#!/bin/bash

# Pre-Migration Analysis Script
# Runs comprehensive SQL queries against the database

echo "🔍 Starting Pre-Migration Analysis..."
echo "======================================"
echo ""

DB_CONTAINER="affexai-postgres"
DB_NAME="affexai_dev"
DB_USER="postgres"

# Function to run query and display results
run_query() {
    local title="$1"
    local query="$2"
    
    echo "📊 $title"
    echo "---"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "$query"
    echo ""
}

# 1. Component Distribution
run_query "1. Component Distribution" "
SELECT 
  type,
  COUNT(*) as count,
  COUNT(DISTINCT page_id) as used_in_pages,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM cms_components 
GROUP BY type
ORDER BY count DESC;
"

# 2. Props Structure Analysis
run_query "2. Props Structure (blockType usage)" "
SELECT 
  type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN props ? 'blockType' THEN 1 END) as has_block_type,
  COUNT(CASE WHEN props ? 'blockCategory' THEN 1 END) as has_block_category,
  COUNT(CASE WHEN props ? 'blockId' THEN 1 END) as has_block_id
FROM cms_components 
GROUP BY type;
"

# 3. Sample Props
run_query "3. Sample Block Component Props (first 5)" "
SELECT 
  id,
  type,
  jsonb_pretty(props) as props_sample
FROM cms_components 
WHERE type = 'block'
LIMIT 5;
"

# 4. Page Relationships
run_query "4. Pages with Block Components" "
SELECT 
  p.id,
  p.slug,
  p.title,
  p.status,
  COUNT(c.id) as component_count,
  COUNT(CASE WHEN c.type = 'block' THEN 1 END) as block_components
FROM cms_pages p
LEFT JOIN cms_components c ON c.page_id = p.id
GROUP BY p.id, p.slug, p.title, p.status
HAVING COUNT(CASE WHEN c.type = 'block' THEN 1 END) > 0
ORDER BY block_components DESC
LIMIT 10;
"

# 5. Component Hierarchy
run_query "5. Component Hierarchy" "
SELECT 
  parent_id IS NULL as is_root,
  type,
  COUNT(*) as count
FROM cms_components
GROUP BY parent_id IS NULL, type
ORDER BY is_root DESC, count DESC;
"

# 6. Migration Target (components with blockType or blockId)
run_query "6. Migration Target (Components with blockType or blockId)" "
SELECT 
  COUNT(*) as components_to_migrate,
  COUNT(CASE WHEN props ? 'blockType' THEN 1 END) as has_block_type,
  COUNT(CASE WHEN props ? 'blockId' THEN 1 END) as has_block_id,
  COUNT(DISTINCT props->>'blockType') as unique_block_types,
  COUNT(DISTINCT props->>'blockId') as unique_block_ids
FROM cms_components
WHERE type = 'block' 
  AND (props ? 'blockType' OR props ? 'blockId');
"

# 7. Sample Migration Targets
run_query "7. Sample Components to Migrate" "
SELECT 
  id,
  page_id,
  type,
  props->>'blockType' as block_type,
  props->>'blockCategory' as block_category,
  props->>'blockId' as block_id
FROM cms_components
WHERE type = 'block' 
  AND (props ? 'blockType' OR props ? 'blockId')
LIMIT 10;
"

# 8. Non-Migration Target
run_query "8. Components NOT to Migrate" "
SELECT 
  type,
  COUNT(*) as count
FROM cms_components
WHERE type != 'block' OR (props->>'blockType' IS NULL AND props->>'blockId' IS NULL)
GROUP BY type
ORDER BY count DESC;
"

# 9. Duplicate BlockTypes
run_query "9. Duplicate BlockTypes (reusable blocks)" "
SELECT 
  props->>'blockType' as block_type,
  COUNT(*) as usage_count
FROM cms_components
WHERE props ? 'blockType'
GROUP BY props->>'blockType'
HAVING COUNT(*) > 1
ORDER BY usage_count DESC
LIMIT 10;
"

# 10. Props Keys Analysis
run_query "10. Common Props Keys in Block Components" "
SELECT 
  jsonb_object_keys(props) as prop_key,
  COUNT(*) as usage_count
FROM cms_components
WHERE type = 'block'
GROUP BY prop_key
ORDER BY usage_count DESC
LIMIT 15;
"

# 11. Table Size
run_query "11. Table Size & Performance" "
SELECT 
  pg_size_pretty(pg_total_relation_size('cms_components')) as total_size,
  pg_size_pretty(pg_relation_size('cms_components')) as table_size,
  pg_size_pretty(pg_indexes_size('cms_components')) as indexes_size,
  (SELECT COUNT(*) FROM cms_components) as row_count;
"

# 12. Component Types in Use
run_query "12. All Component Types" "
SELECT 
  type, 
  COUNT(*) as count
FROM cms_components
GROUP BY type
ORDER BY count DESC;
"

# 13. Published Pages Impact
run_query "13. Published Pages with Block Components" "
SELECT 
  COUNT(DISTINCT p.id) as published_pages_with_blocks,
  COUNT(DISTINCT CASE WHEN c.props ? 'blockType' OR c.props ? 'blockId' THEN p.id END) as published_pages_to_migrate
FROM cms_pages p
JOIN cms_components c ON c.page_id = p.id
WHERE p.status = 'published'
  AND c.type = 'block';
"

# 14. Check for existing columns (should not exist yet)
run_query "14. Current Schema Check" "
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cms_components'
  AND column_name IN ('block_type', 'block_category', 'block_id', 'reusable_component_id')
ORDER BY column_name;
"

echo "======================================"
echo "✅ Analysis Complete!"
echo ""
echo "📄 Review the results above to make migration decision."
echo ""
