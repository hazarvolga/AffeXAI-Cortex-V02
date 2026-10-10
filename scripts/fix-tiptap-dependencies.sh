#!/bin/bash
# Fix Tiptap dependency conflicts for production deployment

set -e

echo "🔧 Fixing Tiptap dependencies..."
echo "================================"

# 1. Clean existing installations
echo ""
echo "Step 1/5: Cleaning node_modules..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
echo "✅ Cleaned node_modules"

# 2. Clean package-lock.json
echo ""
echo "Step 2/5: Removing package-lock.json..."
rm -f package-lock.json
echo "✅ Removed package-lock.json"

# 3. Ensure consistent Tiptap versions in frontend
cd apps/frontend
TIPTAP_VERSION="3.7.2"
PROSEMIRROR_STATE="1.4.3"
PROSEMIRROR_VIEW="1.37.4"
PROSEMIRROR_MODEL="1.25.4"
PROSEMIRROR_TRANSFORM="1.10.5"

echo ""
echo "Step 3/5: Locking Tiptap to version ${TIPTAP_VERSION}..."
npm install --save-exact \
  @tiptap/core@${TIPTAP_VERSION} \
  @tiptap/react@${TIPTAP_VERSION} \
  @tiptap/starter-kit@${TIPTAP_VERSION} \
  @tiptap/extension-mention@${TIPTAP_VERSION} \
  @tiptap/suggestion@${TIPTAP_VERSION} \
  @tiptap/pm@${TIPTAP_VERSION} \
  prosemirror-state@${PROSEMIRROR_STATE} \
  prosemirror-view@${PROSEMIRROR_VIEW} \
  prosemirror-model@${PROSEMIRROR_MODEL} \
  prosemirror-transform@${PROSEMIRROR_TRANSFORM}

echo "✅ Locked Tiptap packages"

cd ../..

# 4. Reinstall all dependencies
echo ""
echo "Step 4/5: Installing dependencies..."
npm install --legacy-peer-deps
echo "✅ Dependencies installed"

# 5. Verify build
echo ""
echo "Step 5/5: Testing build..."
npm run build:frontend

echo ""
echo "================================"
echo "✅ Tiptap dependencies fixed!"
echo ""
echo "📋 Next steps:"
echo "  1. Review git diff to see changes"
echo "  2. Commit package.json and package-lock.json"
echo "  3. Push to trigger CI/CD validation"
echo ""
echo "Git commands:"
echo "  git add package.json package-lock.json apps/frontend/package.json"
echo "  git commit -m 'fix: resolve Tiptap dependency conflicts for production'"
echo "  git push"
