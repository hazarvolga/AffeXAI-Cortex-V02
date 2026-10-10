#!/bin/bash

# Configuration
API_URL="http://localhost:9006/api/social-media/auth-url"
PROVIDER="instagram"
CALLBACK_URL="http://localhost:9003/admin/social/callback"

echo "Testing Instagram Auth URL Generation..."
echo "Endpoint: $API_URL"

# We expect a JSON response with { "url": "https://www.facebook.com/..." }
# We need to URL encode the callback url for the curl request query param if complex, but simple version:
curl -v "$API_URL?provider=$PROVIDER&redirectUri=$CALLBACK_URL"

echo ""
echo "Check if the response contains a valid Facebook OAuth URL."
