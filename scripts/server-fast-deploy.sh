#!/bin/bash

# Server fast deployment script - minimizes downtime on production server
# This script focuses on essential updates only, skipping SSL, cron, firewall

set -e

echo "🚀 Starting server fast deployment..."

# Quick health check before deployment
echo "🏥 Pre-deployment health check..."
if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "⚠️ Application not responding, but continuing with deployment..."
fi

# Stop PM2 processes (minimal downtime)
echo "⏹️ Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true

# Quick build and start (essential only)
echo "🔨 Building application..."
cd /var/www/marinaobuv/web

echo "🎭 Ensuring Playwright Chromium browser is installed..."
npm run playwright:install:ci || echo "⚠️ Playwright install failed or skipped, aggregator parser may be unavailable"

npm run build

# Start PM2 processes immediately
echo "🚀 Starting PM2 processes..."
cd /var/www/marinaobuv
pm2 start ecosystem.config.js --env production --update-env

# Quick health check
echo "🏥 Post-deployment health check..."
sleep 5
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Application is healthy after deployment"
else
    echo "⚠️ Application health check failed, but deployment completed"
fi

# Save PM2 state
pm2 save

echo "✅ Server fast deployment completed!"
echo "📊 Deployment time: $(date)"
echo "💡 Run 'npm run deploy:full' for complete deployment with SSL, cron, etc."
