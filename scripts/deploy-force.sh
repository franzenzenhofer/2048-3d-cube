#!/bin/bash
set -euo pipefail

PROJECT_NAME="2048-3d-cube"
CUSTOM_DOMAIN="2048-3d.franzai.com"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Deploying version $VERSION"

echo "🚀 Starting deployment of $PROJECT_NAME"

echo "🏗️ Building for production..."
npm run build

echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=$PROJECT_NAME

echo "✅ Deployment complete!"
echo "🎮 Game available at:"
echo "   - https://$PROJECT_NAME.pages.dev"
echo "   - https://2048-3d-cube.franzai.com"