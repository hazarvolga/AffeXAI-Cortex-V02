#!/bin/bash

# Configuration
API_URL="http://localhost:9006/api/social-media/accounts"
# You might need to replace this with a valid JWT token for your local environment
# If you don't have one, the backend will return 401. 
# Assuming development environment might bypass auth or user has a way to get token.
# For now, let's try to hit it and see if we get ANY response, even 401 is better than connection refused.
# BUT, we need a token to get data. 
# Let's assume the user can provide one or we can login. 
# For automated testing without a token, we might be limited.
# Let's try to login first if possible, or ask user to provide token.

# Hardcoded test user credentials (if available in seed)
# EMAIL="admin@affexai.com"
# PASSWORD="password"

echo "Testing Social Accounts API..."
echo "URL: $API_URL"

# Simple curl to check connectivity
curl -v "$API_URL"

echo ""
echo "Note: If you see 401 Unauthorized, you need to provide a Bearer token."
echo "Usage: ./scripts/verify_social_accounts.sh <TOKEN>"
