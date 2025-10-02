#!/bin/bash

# Deploy cron job for parsing monitoring
# This script should be run during deployment to set up the hourly parsing cron job

echo "🚀 Setting up parsing cron job for deployment..."

# Get the current directory (should be the web directory)
WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_SCRIPT="$WEB_DIR/src/scripts/hourly-cron.ts"

# Check if the cron script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "❌ Error: Cron script not found at $CRON_SCRIPT"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "$WEB_DIR/.env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Make sure DATABASE_URL is set in your environment."
fi

# Create logs directory if it doesn't exist
mkdir -p "$WEB_DIR/logs"

# Remove any existing parsing cron jobs to avoid duplicates
echo "🧹 Cleaning up existing parsing cron jobs..."
crontab -l 2>/dev/null | grep -v "hourly-cron.ts" | crontab -

# Create the cron job entry
CRON_ENTRY="0 * * * * cd $WEB_DIR && npx tsx src/scripts/hourly-cron.ts >> $WEB_DIR/logs/parsing-cron.log 2>&1"

# Add to crontab
echo "📅 Adding cron job: $CRON_ENTRY"
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Parsing cron job deployed successfully!"
echo "📊 The parsing script will run every hour at minute 0"
echo "📝 Logs will be written to: $WEB_DIR/logs/parsing-cron.log"
echo ""
echo "🔍 To verify the setup:"
echo "   crontab -l | grep hourly-cron"
echo ""
echo "🧪 To test manually:"
echo "   cd $WEB_DIR && npx tsx src/scripts/hourly-cron.ts"
echo ""
echo "📈 Monitor at: https://yourdomain.com/admin/parsing"
