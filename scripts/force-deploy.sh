#!/bin/bash
set -euo pipefail

PROJECT_NAME="2048-3d-cube"
CUSTOM_DOMAIN="2048-3d.franzai.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting FORCE deployment process (bypassing tests)${NC}"

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
git commit -m "chore: bump version to $NEW_VERSION (force deploy)

[skip ci]" || true

echo -e "${BLUE}☁️  Deploying to Cloudflare Pages...${NC}"
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name=$PROJECT_NAME 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract deployment URL from output
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-z0-9]+\.'$PROJECT_NAME'\.pages\.dev' | head -1)

echo -e "${BLUE}🔍 Verifying deployment...${NC}"

# Function to check if a URL returns the correct version
check_url() {
  local url=$1
  local max_retries=12
  local retry_count=0
  
  echo -e "${YELLOW}Checking $url...${NC}"
  
  while [ $retry_count -lt $max_retries ]; do
    # Fetch the page and look for the version string
    RESPONSE=$(curl -s "$url" | grep -o "v$NEW_VERSION" || true)
    
    if [ ! -z "$RESPONSE" ]; then
      echo -e "${GREEN}✓ Version $NEW_VERSION confirmed at $url${NC}"
      return 0
    fi
    
    retry_count=$((retry_count + 1))
    echo -e "${YELLOW}  Attempt $retry_count/$max_retries - Version not yet available, waiting 5s...${NC}"
    sleep 5
  done
  
  echo -e "${RED}✗ Failed to verify version at $url after $max_retries attempts${NC}"
  return 1
}

# Check all URLs
VERIFICATION_FAILED=false

# Check deployment URL
if [ ! -z "$DEPLOY_URL" ]; then
  check_url "$DEPLOY_URL" || VERIFICATION_FAILED=true
fi

# Check main pages.dev URL
check_url "https://$PROJECT_NAME.pages.dev" || VERIFICATION_FAILED=true

# Check custom domain
check_url "https://$CUSTOM_DOMAIN" || VERIFICATION_FAILED=true

if [ "$VERIFICATION_FAILED" = true ]; then
  echo -e "${RED}⚠️  Warning: Could not verify deployment on all URLs${NC}"
  echo -e "${YELLOW}The deployment may still be propagating. Please check manually in a few minutes.${NC}"
else
  echo -e "${GREEN}✅ Deployment verified on all URLs!${NC}"
fi

echo -e "${BLUE}🌐 Live URLs:${NC}"
echo "  - Deployment: ${DEPLOY_URL:-N/A}"
echo "  - Pages.dev: https://$PROJECT_NAME.pages.dev"
echo "  - Custom: https://$CUSTOM_DOMAIN"
echo -e "${YELLOW}📦 Version $NEW_VERSION deployed!${NC}"

# Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push

echo -e "${GREEN}🎉 All done! (Tests were bypassed)${NC}"