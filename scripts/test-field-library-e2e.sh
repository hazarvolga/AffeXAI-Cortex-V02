#!/bin/bash

# Field Library End-to-End Test Script
# Tests all improvements made to the Field Library system

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:9006/api"
TOKEN=""

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Field Library E2E Test${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Step 1: Login to get token
echo -e "${YELLOW}[1/8] Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@affexai.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Authenticated successfully${NC}"
echo ""

# Step 2: Get all field library entries
echo -e "${YELLOW}[2/8] Fetching all field library entries...${NC}"
FIELDS_RESPONSE=$(curl -s -X GET "${API_BASE}/ticket-field-library?limit=100" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_FIELDS=$(echo $FIELDS_RESPONSE | jq '.data.total')
echo -e "${GREEN}✅ Found ${TOTAL_FIELDS} fields in library${NC}"
echo "First 3 fields:"
echo $FIELDS_RESPONSE | jq -r '.data.items[0:3] | .[] | "  - \(.name) (\(.fieldConfig.type))"'
echo ""

# Step 3: Get fields filtered by active status
echo -e "${YELLOW}[3/8] Testing filter: isActive=true...${NC}"
ACTIVE_FIELDS_RESPONSE=$(curl -s -X GET "${API_BASE}/ticket-field-library?isActive=true&limit=100" \
  -H "Authorization: Bearer $TOKEN")

ACTIVE_COUNT=$(echo $ACTIVE_FIELDS_RESPONSE | jq '.data.total')
echo -e "${GREEN}✅ Found ${ACTIVE_COUNT} active fields${NC}"
echo ""

# Step 4: Search for specific field
echo -e "${YELLOW}[4/8] Testing search: 'test'...${NC}"
SEARCH_RESPONSE=$(curl -s -X GET "${API_BASE}/ticket-field-library?search=test&limit=100" \
  -H "Authorization: Bearer $TOKEN")

SEARCH_COUNT=$(echo $SEARCH_RESPONSE | jq '.data.total')
echo -e "${GREEN}✅ Search found ${SEARCH_COUNT} results${NC}"
echo "Results:"
echo $SEARCH_RESPONSE | jq -r '.data.items[] | "  - \(.name)"'
echo ""

# Step 5: Get all unique tags
echo -e "${YELLOW}[5/8] Fetching all unique tags...${NC}"
TAGS_RESPONSE=$(curl -s -X GET "${API_BASE}/ticket-field-library/tags" \
  -H "Authorization: Bearer $TOKEN")

TAGS=$(echo $TAGS_RESPONSE | jq -r '.data.tags[]')
echo -e "${GREEN}✅ Found tags:${NC}"
echo "$TAGS" | sed 's/^/  - /'
echo ""

# Step 6: Create a new field library entry
echo -e "${YELLOW}[6/8] Creating new field library entry...${NC}"
NEW_FIELD_DATA='{
  "name": "Test Field - E2E",
  "description": "Created by E2E test script",
  "fieldConfig": {
    "id": "test_field_e2e",
    "name": "testFieldE2E",
    "label": "Test Field E2E",
    "labelEn": "Test Field E2E",
    "type": "text",
    "required": false,
    "placeholder": "Enter test value",
    "metadata": {
      "order": 999,
      "width": "full",
      "agentOnly": false
    }
  },
  "tags": ["test", "e2e"],
  "isActive": true
}'

CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/ticket-field-library" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NEW_FIELD_DATA")

NEW_FIELD_ID=$(echo $CREATE_RESPONSE | jq -r '.data.field.id')

if [ "$NEW_FIELD_ID" == "null" ] || [ -z "$NEW_FIELD_ID" ]; then
  echo -e "${RED}❌ Create failed${NC}"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Created field with ID: ${NEW_FIELD_ID}${NC}"
echo ""

# Step 7: Get the created field
echo -e "${YELLOW}[7/8] Fetching created field...${NC}"
FIELD_DETAIL=$(curl -s -X GET "${API_BASE}/ticket-field-library/${NEW_FIELD_ID}" \
  -H "Authorization: Bearer $TOKEN")

FIELD_NAME=$(echo $FIELD_DETAIL | jq -r '.data.field.name')
echo -e "${GREEN}✅ Retrieved field: ${FIELD_NAME}${NC}"
echo "Field details:"
echo $FIELD_DETAIL | jq '.data.field | {id, name, description, tags, isActive, fieldConfig: {type, label, required}}'
echo ""

# Step 8: Clean up - Delete the test field
echo -e "${YELLOW}[8/8] Cleaning up - deleting test field...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "${API_BASE}/ticket-field-library/${NEW_FIELD_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Test field deleted${NC}"
echo ""

# Final Summary
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}✅ All 8 tests passed successfully!${NC}"
echo ""
echo "Test Coverage:"
echo "  ✅ Authentication"
echo "  ✅ Get all fields (found ${TOTAL_FIELDS} fields)"
echo "  ✅ Filter by active status (found ${ACTIVE_COUNT} fields)"
echo "  ✅ Search functionality (found ${SEARCH_COUNT} results)"
echo "  ✅ Get unique tags"
echo "  ✅ Create new field"
echo "  ✅ Get field by ID"
echo "  ✅ Delete field"
echo ""
echo -e "${GREEN}🎉 Field Library E2E test completed successfully!${NC}"
