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

echo "📦 Force deploying version $NEW_VERSION (was $CURRENT_VERSION)"
echo "📅 Deployment date: $DEPLOY_DATE"
echo "⚠️  Skipping tests - FORCE deployment!"

echo "🚀 Starting deployment of $PROJECT_NAME"

echo "🏗️ Building for production..."
npm run build

echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=$PROJECT_NAME

echo "⏳ Waiting for deployment to propagate..."
sleep 15

echo "🧪 Running live deployment verification..."

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

# Final summary
echo ""
echo "🎉 Deployment Summary:"
echo "   📦 Version: $NEW_VERSION"
echo "   📅 Deployed: $DEPLOY_DATE"
echo "   🎮 Live at:"
echo "      - https://2048-3d-cube.franzai.com"
echo "      - https://$PROJECT_NAME.pages.dev"
echo ""

# Commit version bump
git add package.json package-lock.json
git commit -m "Bump version to $NEW_VERSION

Force deployed on $DEPLOY_DATE

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