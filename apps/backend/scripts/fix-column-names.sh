#!/bin/bash
# Batch fix for camelCase column names in migrations
# Converts "createdAt" → created_at, "updatedAt" → updated_at, etc.

echo "🔧 Fixing column naming in migrations..."

# List of migrations with createdAt issues
migrations=(
  "src/database/migrations/1728000000001-CreateRolesTable.ts"
  "src/database/migrations/1728000000009-create-subscribers-table.ts"
  "src/database/migrations/1728000000017-CreateBulkImportExportTables.ts"
  "src/database/migrations/1728000000028-CreateCompanyKnowledgeSources.ts"
  "src/database/migrations/1728000000029-CreateChatTables.ts"
  "src/database/migrations/1728000000036-CreateEmailTemplatesTable.ts"
  "src/database/migrations/1728908500000-CreateTicketsTables.ts"
  "src/database/migrations/1728910000000-ExtendUsersTableAndCreateRoles.ts"
  "src/database/migrations/1729360000000-CreatePageTemplatesTable.ts"
  "src/database/migrations/1730141000000-AddTicketDisplayNumber.ts"
)

count=0
for file in "${migrations[@]}"; do
  if [ -f "$file" ]; then
    # Replace quoted camelCase with snake_case
    sed -i.bak \
      -e 's/"createdAt"/created_at/g' \
      -e 's/"updatedAt"/updated_at/g' \
      -e 's/"deletedAt"/deleted_at/g' \
      "$file"
    
    echo "  ✓ Fixed: $(basename $file)"
    ((count++))
  fi
done

echo ""
echo "✅ Fixed $count migration files"
echo "📝 Backup files created with .bak extension"
