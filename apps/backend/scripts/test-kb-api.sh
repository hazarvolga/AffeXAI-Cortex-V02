#!/bin/bash

echo "🧪 Testing KB Categories API Endpoints"
echo "========================================"
echo ""

# Test 1: Frontend API Route (should work without auth for testing)
echo "1️⃣ Testing Frontend API Route: /api/admin/knowledge-base/categories"
echo "---"
curl -s http://localhost:9003/api/admin/knowledge-base/categories | jq '.' || echo "Failed"
echo ""
echo ""

# Test 2: Backend API (with auth)
echo "2️⃣ Testing Backend API: /api/knowledge-base/categories"
echo "---"
echo "This endpoint requires authentication, checking if accessible..."
curl -s http://localhost:9006/api/knowledge-base/categories | jq '.'
echo ""
echo ""

echo "✅ Test Complete"
