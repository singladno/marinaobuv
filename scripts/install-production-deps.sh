#!/usr/bin/env bash

# Install production dependencies for cron jobs
# This ensures tsx and other production dependencies are available after VM reboot

set -euo pipefail

echo "🔄 Installing production dependencies for cron jobs..."

cd /var/www/marinaobuv/web

# Install all dependencies (including production ones needed for cron)
npm install --ignore-scripts

echo "✅ Production dependencies installed successfully"
echo "📦 tsx is now available for cron jobs"

# Verify tsx is available
if [ -f "./node_modules/.bin/tsx" ]; then
    echo "✅ tsx binary is available"
else
    echo "❌ tsx binary not found - cron jobs will fail"
    exit 1
fi

echo "🎉 Server is ready for cron jobs after reboot"
