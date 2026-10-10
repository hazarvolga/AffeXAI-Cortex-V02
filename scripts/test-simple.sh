#!/bin/bash

API_BASE="http://localhost:9006/api"

echo "=== Testing Field Library API ==="
echo ""

# Login
echo "1. Login..."
RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@affexai.com\",\"password\":\"Admin123!\"}")

echo "Login response:"
echo "$RESPONSE" | jq '.'
echo ""

TOKEN=$(echo "$RESPONSE" | jq -r '.data.access_token')
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test Field Library endpoint
echo "2. Get Field Library..."
FIELDS=$(curl -s -X GET "${API_BASE}/ticket-field-library?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Field Library response:"
echo "$FIELDS" | jq '.'
