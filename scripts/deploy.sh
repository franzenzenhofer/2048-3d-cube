#!/bin/bash
set -euo pipefail

PROJECT_NAME="2048-3d-cube"
CUSTOM_DOMAIN="2048-3d.franzai.com"

# Auto-increment version
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
PATCH=$((VERSION_PARTS[2] + 1))
NEW_VERSION="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}.$PATCH"

# Update package.json with new version
npm version $NEW_VERSION --no-git-tag-version

# Get deployment date
DEPLOY_DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "📦 Deploying version $NEW_VERSION (was $CURRENT_VERSION)"
echo "📅 Deployment date: $DEPLOY_DATE"

echo "🚀 Starting deployment of $PROJECT_NAME"

echo "📋 Running pre-deployment tests..."
npm test -- --run
if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment tests failed! Deployment aborted."
    echo "🔧 Fix all failing tests before deploying."
    exit 1
fi

echo "✅ Pre-deployment tests passed!"

echo "🏗️ Building for production..."
npm run build

echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=$PROJECT_NAME

echo "🌐 Setting up custom domain..."
PROJECT_SUBDOMAIN="$PROJECT_NAME.pages.dev"

echo "🔗 Adding custom domain to Pages project..."
curl -X POST "https://api.cloudflare.com/client/v4/accounts/ecf21e85812dfa5b2a35245257fc71f5/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$CUSTOM_DOMAIN\"}" || echo "Domain might already be added"

echo "📝 Creating DNS record..."
ZONE_ID="11bfe82c00e8c9e116e1e542b140f172"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"2048-3d\",
    \"content\": \"$PROJECT_SUBDOMAIN\",
    \"ttl\": 3600,
    \"proxied\": true
  }" || echo "DNS record might already exist"

echo "⏳ Waiting for deployment to propagate..."
sleep 15

echo "🧪 Running live deployment verification..."
echo "   Note: The correct domain is https://2048-3d.franzai.com (not 2048-3d-cube)"

# Check main domain
echo "🌐 Checking https://2048-3d-cube.franzai.com..."
LIVE_CHECK=$(curl -s https://2048-3d-cube.franzai.com | grep -o "v${NEW_VERSION}" || echo "NOT FOUND")
if [[ "$LIVE_CHECK" == "v${NEW_VERSION}" ]]; then
    echo "✅ Version $NEW_VERSION is LIVE on franzai.com!"
else
    echo "❌ Version $NEW_VERSION NOT found on franzai.com (found: $LIVE_CHECK)"
    echo "⏳ Waiting 10 more seconds for CDN propagation..."
    sleep 10
    LIVE_CHECK=$(curl -s https://2048-3d-cube.franzai.com | grep -o "v${NEW_VERSION}" || echo "NOT FOUND")
    if [[ "$LIVE_CHECK" == "v${NEW_VERSION}" ]]; then
        echo "✅ Version $NEW_VERSION is now LIVE on franzai.com!"
    else
        echo "⚠️  Warning: New version may still be propagating through CDN"
    fi
fi

# Check pages.dev domain
echo "🌐 Checking https://$PROJECT_SUBDOMAIN..."
PAGES_CHECK=$(curl -s https://$PROJECT_SUBDOMAIN | grep -o "v${NEW_VERSION}" || echo "NOT FOUND")
if [[ "$PAGES_CHECK" == "v${NEW_VERSION}" ]]; then
    echo "✅ Version $NEW_VERSION is LIVE on pages.dev!"
else
    echo "⚠️  Version not yet on pages.dev (found: $PAGES_CHECK)"
fi

# Post-deployment tests
echo ""
echo "🧪 Running post-deployment live tests..."

# Test 1: Check if site is accessible
echo "   Testing site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://2048-3d.franzai.com)
if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "   ✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Site returned HTTP $HTTP_STATUS"
fi

# Test 2: Check if JavaScript loads
echo "   Testing JavaScript loading..."
JS_CHECK=$(curl -s https://2048-3d.franzai.com | grep -c "script")
if [[ "$JS_CHECK" -gt 0 ]]; then
    echo "   ✅ JavaScript resources found"
else
    echo "   ❌ No JavaScript resources found"
fi

# Test 3: Check if CSS loads
echo "   Testing CSS loading..."
CSS_CHECK=$(curl -s https://2048-3d.franzai.com | grep -c "stylesheet")
if [[ "$CSS_CHECK" -gt 0 ]]; then
    echo "   ✅ CSS resources found"
else
    echo "   ❌ No CSS resources found"
fi

# Final summary
echo ""
echo "🎉 Deployment Summary:"
echo "   📦 Version: $NEW_VERSION"
echo "   📅 Deployed: $DEPLOY_DATE"
echo "   🎮 Live at:"
echo "      - https://2048-3d.franzai.com"
echo "      - https://$PROJECT_SUBDOMAIN"
echo ""

# Commit version bump
git add package.json package-lock.json
git commit -m "Bump version to $NEW_VERSION

Deployed on $DEPLOY_DATE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "No version changes to commit"

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin main
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Failed to push to GitHub. You may need to pull first or resolve conflicts."
    echo "   Try: git pull origin main --rebase"
fi