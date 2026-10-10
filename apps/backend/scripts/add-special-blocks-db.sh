#!/bin/bash

echo "🚀 Adding special blocks to products and downloads pages..."

# Database config from .env
DB_HOST="localhost"
DB_PORT="5434"
DB_NAME="affexai_dev"
DB_USER="postgres"
DB_PASS="postgres"

# Products page - special-product-grid block
PRODUCT_BLOCK='{
  "id": "product-grid-'$(date +%s)'",
  "type": "special-product-grid",
  "props": {
    "title": "Ürünlerimiz",
    "description": "Size en uygun ürünü keşfedin"
  },
  "children": []
}'

# Downloads page - special-resource-tabs block
RESOURCE_BLOCK='{
  "id": "resource-tabs-'$(date +%s)'",
  "type": "special-resource-tabs",
  "props": {
    "title": "Kaynaklar",
    "description": "İhtiyacınız olan tüm kaynaklar"
  },
  "children": []
}'

echo "📄 Updating products page..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
UPDATE cms_pages
SET components = COALESCE(components, '[]'::jsonb) || '$PRODUCT_BLOCK'::jsonb
WHERE slug = 'products'
AND NOT (components @> '[{\"type\": \"special-product-grid\"}]'::jsonb);
"

echo "✅ Products page updated"

echo ""
echo "📄 Updating downloads page..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
UPDATE cms_pages
SET components = COALESCE(components, '[]'::jsonb) || '$RESOURCE_BLOCK'::jsonb
WHERE slug = 'downloads'
AND NOT (components @> '[{\"type\": \"special-resource-tabs\"}]'::jsonb);
"

echo "✅ Downloads page updated"

echo ""
echo "📊 Checking results..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
  slug,
  title,
  jsonb_array_length(components) as component_count,
  CASE
    WHEN components @> '[{\"type\": \"special-product-grid\"}]'::jsonb THEN 'YES'
    ELSE 'NO'
  END as has_product_grid,
  CASE
    WHEN components @> '[{\"type\": \"special-resource-tabs\"}]'::jsonb THEN 'YES'
    ELSE 'NO'
  END as has_resource_tabs
FROM cms_pages
WHERE slug IN ('products', 'downloads')
ORDER BY slug;
"

echo ""
echo "🎉 Done! View pages at:"
echo "  - Products: http://localhost:9003/products"
echo "  - Downloads: http://localhost:9003/downloads"
