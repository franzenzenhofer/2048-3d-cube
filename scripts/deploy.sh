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

echo "🏗️ Building for production..."
npm run build

echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=$PROJECT_NAME

echo "🌐 Setting up custom domain..."
PROJECT_SUBDOMAIN="$PROJECT_NAME.pages.dev"

echo "🔗 Adding custom domain to Pages project..."
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
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
sleep 10

echo "🧪 Running post-deployment tests..."
npm run test:production

echo "✅ Deployment complete!"
echo "🎮 Game available at:"
echo "   - https://$PROJECT_SUBDOMAIN"
echo "   - https://$CUSTOM_DOMAIN"