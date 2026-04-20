#!/bin/bash

# Server fast deployment script - minimizes downtime on production server
# This script focuses on essential updates only, skipping SSL, cron, firewall

set -e
set -o pipefail

echo "🚀 Starting server fast deployment..."

STAGING_DIR=".next-staging"
WEB_DIR="/var/www/marinaobuv/web"
ROOT_DIR="/var/www/marinaobuv"

# Quick health check before deployment (non-fatal)
echo "🏥 Pre-deployment health check..."
if ! curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️ Application not responding on :3000 — continuing (may be first boot)"
fi

echo "🔨 Building application into ${STAGING_DIR} (keeps current .next until build succeeds)..."
cd "$WEB_DIR"
rm -rf "${STAGING_DIR}"
export NEXT_DIST_DIR="${STAGING_DIR}"
if ! npm run build; then
    echo "❌ Build failed — production .next was not modified"
    rm -rf "${STAGING_DIR}" 2>/dev/null || true
    exit 1
fi
unset NEXT_DIST_DIR

if [ ! -f "${STAGING_DIR}/BUILD_ID" ]; then
    echo "❌ No BUILD_ID in staging output"
    rm -rf "${STAGING_DIR}" 2>/dev/null || true
    exit 1
fi

echo "🔄 Swapping staging build into .next and restarting PM2..."
cd "$ROOT_DIR"
pm2 stop marinaobuv 2>/dev/null || true

cd "$WEB_DIR"
rm -rf .next-trash-fast
if [ -d .next ]; then
    mv .next .next-trash-fast
fi
mv "${STAGING_DIR}" .next
rm -rf .next-trash-fast
cd "$ROOT_DIR"

echo "🚀 Starting PM2 processes..."
export NEXT_DIST_DIR=
pm2 startOrReload ecosystem.config.js --env production --update-env 2>/dev/null || \
  pm2 start ecosystem.config.js --env production --update-env

# Quick health check
echo "🏥 Post-deployment health check..."
sleep 5
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Application is healthy after deployment"
else
    echo "❌ Application health check failed after deployment"
    exit 1
fi

# Save PM2 state
pm2 save

echo "✅ Server fast deployment completed!"
echo "📊 Deployment time: $(date)"
echo "💡 Run 'npm run deploy:full' for complete deployment with SSL, cron, etc."
