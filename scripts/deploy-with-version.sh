#!/bin/bash
set -euo pipefail

PROJECT_NAME="2048-3d-cube"
CUSTOM_DOMAIN="2048-3d.franzai.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment process${NC}"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"

# Parse version components
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo -e "${GREEN}New version: $NEW_VERSION${NC}"

# Update package.json with new version
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\\n');
"

echo -e "${BLUE}📋 Running tests...${NC}"
npm test -- --run || {
  echo -e "${YELLOW}⚠️  Tests failed, reverting version${NC}"
  git checkout package.json
  exit 1
}

echo -e "${BLUE}🏗️  Building for production...${NC}"
npm run build || {
  echo -e "${YELLOW}⚠️  Build failed, reverting version${NC}"
  git checkout package.json
  exit 1
}

# Generate build info
BUILD_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
BUILD_HASH=$(git rev-parse --short HEAD)
echo -e "${BLUE}📝 Build info:${NC}"
echo "  Version: $NEW_VERSION"
echo "  Date: $BUILD_DATE"
echo "  Commit: $BUILD_HASH"

# Create build info file
cat > dist/build-info.json << EOF
{
  "version": "$NEW_VERSION",
  "buildDate": "$BUILD_DATE",
  "commit": "$BUILD_HASH"
}
EOF

# Commit version bump
git add package.json
git commit -m "chore: bump version to $NEW_VERSION

[skip ci]" || true

echo -e "${BLUE}☁️  Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=$PROJECT_NAME

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}🌐 URLs:${NC}"
echo "  - https://$PROJECT_NAME.pages.dev"
echo "  - https://$CUSTOM_DOMAIN"
echo -e "${YELLOW}📦 Version $NEW_VERSION deployed successfully!${NC}"

# Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push

# Create GitHub release
if command -v gh &> /dev/null; then
  echo -e "${BLUE}🏷️  Creating GitHub release...${NC}"
  gh release create "v$NEW_VERSION" \
    --title "Release v$NEW_VERSION" \
    --notes "### Changes in v$NEW_VERSION

- Automated deployment on $(date -u +"%Y-%m-%d")
- Build: $BUILD_HASH

### Play the Game
- 🎮 [Play on franzai.com](https://$CUSTOM_DOMAIN)
- 🌐 [Play on Cloudflare Pages](https://$PROJECT_NAME.pages.dev)
" || echo "Release creation failed, continuing..."
fi

echo -e "${GREEN}🎉 All done!${NC}"