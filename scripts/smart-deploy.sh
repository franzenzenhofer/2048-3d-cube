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

# Functions
log_info() { echo -e "${BLUE}$1${NC}"; }
log_success() { echo -e "${GREEN}$1${NC}"; }
log_warn() { echo -e "${YELLOW}$1${NC}"; }
log_error() { echo -e "${RED}$1${NC}"; }

# Parse arguments
FORCE_DEPLOY=false
SKIP_TESTS=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --force) FORCE_DEPLOY=true; shift ;;
    --skip-tests) SKIP_TESTS=true; shift ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
  esac
done

log_info "🚀 Smart Deployment Script"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "📦 Current version: $CURRENT_VERSION"

# Check if we have uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  log_warn "⚠️  You have uncommitted changes"
  if [ "$FORCE_DEPLOY" = false ]; then
    log_error "❌ Please commit your changes first or use --force flag"
    exit 1
  fi
  log_warn "⚠️  Continuing with --force flag"
fi

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ]; then
  log_info "🧪 Running unit tests..."
  UNIT_TEST_FAILED=false
  if npm test -- --run; then
    log_success "✅ Unit tests passed!"
  else
    log_warn "⚠️  Some unit tests failed"
    UNIT_TEST_FAILED=true
  fi
  
  log_info "🎭 Running E2E tests..."
  E2E_TEST_FAILED=false
  if timeout 300 npm run test:e2e; then
    log_success "✅ E2E tests passed!"
  else
    log_warn "⚠️  Some E2E tests failed or timed out"
    E2E_TEST_FAILED=true
  fi
  
  # Take screenshots during E2E tests
  if [ -d "screenshots" ]; then
    SCREENSHOT_COUNT=$(ls -1 screenshots/*.png 2>/dev/null | wc -l)
    if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
      log_success "📸 Generated $SCREENSHOT_COUNT screenshots"
    fi
  fi
  
  # Decide whether to continue
  if [ "$UNIT_TEST_FAILED" = true ] || [ "$E2E_TEST_FAILED" = true ]; then
    if [ "$FORCE_DEPLOY" = false ]; then
      log_error "❌ Tests failed! Deploy aborted."
      log_error "   Use --force to deploy anyway or --skip-tests to bypass."
      exit 1
    fi
    log_warn "⚠️  Continuing despite test failures (--force mode)"
  else
    log_success "✅ All tests passed!"
  fi
else
  log_warn "⏭️  Skipping tests (--skip-tests flag)"
fi

# Increment version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

log_info "📦 New version: $NEW_VERSION"

# Update package.json
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\\n');
"

# Build
log_info "🏗️  Building for production..."
if npm run build; then
  log_success "✅ Build successful!"
else
  log_error "❌ Build failed!"
  git checkout package.json
  exit 1
fi

# Add build info
BUILD_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
BUILD_HASH=$(git rev-parse --short HEAD || echo "unknown")

cat > dist/build-info.json << EOF
{
  "version": "$NEW_VERSION",
  "buildDate": "$BUILD_DATE",
  "commit": "$BUILD_HASH"
}
EOF

# Create version.txt for easy checking
echo "$NEW_VERSION" > dist/version.txt

# Commit version bump
git add package.json
git commit -m "chore: bump version to $NEW_VERSION" -m "[skip ci]" || true

# Deploy
log_info "☁️  Deploying to Cloudflare Pages..."
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist \
  --project-name=$PROJECT_NAME \
  --commit-dirty=true 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract URLs
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-z0-9]+\.'$PROJECT_NAME'\.pages\.dev' | head -1)

# Simple verification function
verify_deployment() {
  local url=$1
  local max_attempts=10
  local attempt=1
  
  log_info "🔍 Verifying $url"
  
  while [ $attempt -le $max_attempts ]; do
    # Check version.txt for simple verification
    VERSION_CHECK=$(curl -s "$url/version.txt" 2>/dev/null || echo "")
    
    if [ "$VERSION_CHECK" = "$NEW_VERSION" ]; then
      log_success "✅ Version $NEW_VERSION confirmed!"
      return 0
    fi
    
    log_warn "  Attempt $attempt/$max_attempts - Waiting 5s..."
    sleep 5
    attempt=$((attempt + 1))
  done
  
  log_warn "⚠️  Could not verify version at $url"
  return 1
}

# Verify deployments
log_info "🔍 Verifying deployments..."
VERIFIED=true

if [ ! -z "$DEPLOY_URL" ]; then
  verify_deployment "$DEPLOY_URL" || VERIFIED=false
fi

verify_deployment "https://$PROJECT_NAME.pages.dev" || VERIFIED=false

# Summary
echo ""
log_info "📋 Deployment Summary"
log_info "━━━━━━━━━━━━━━━━━━━━"
log_info "Version: $CURRENT_VERSION → $NEW_VERSION"
log_info "Build: $BUILD_HASH"
log_info "Date: $BUILD_DATE"
echo ""
log_info "🌐 URLs:"
log_info "  • https://$PROJECT_NAME.pages.dev"
log_info "  • https://$CUSTOM_DOMAIN"
if [ ! -z "$DEPLOY_URL" ]; then
  log_info "  • $DEPLOY_URL (deployment)"
fi

if [ "$VERIFIED" = true ]; then
  log_success "✅ Deployment successful and verified!"
else
  log_warn "⚠️  Deployment complete but verification pending"
  log_warn "   The new version may take a few minutes to propagate"
fi

# Push to git
if [[ -z $(git status --porcelain) ]]; then
  log_info "📤 Pushing to GitHub..."
  git push
else
  log_warn "⚠️  Uncommitted changes remain - skipping git push"
fi

log_success "🎉 Done!"