#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=2048-3d-cube

# Get the deployment URL
DEPLOYMENT_URL="https://2048-3d-cube.pages.dev"
CUSTOM_URL="https://2048-3d-cube.franzai.com"

echo ""
echo "✅ Deployment complete!"
echo "📱 Preview URL: $DEPLOYMENT_URL"
echo "🌐 Custom URL: $CUSTOM_URL"
echo ""

# Test the deployment
echo "Testing deployment..."
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200\|304"; then
    echo "✅ Preview URL is live!"
else
    echo "⚠️  Preview URL not responding yet (may take a few minutes)"
fi

# Update version in package.json
echo ""
echo "Updating version number..."
npm version patch --no-git-tag-version

echo ""
echo "🎮 3D 2048 is now live at:"
echo "   $DEPLOYMENT_URL"
echo "   $CUSTOM_URL"