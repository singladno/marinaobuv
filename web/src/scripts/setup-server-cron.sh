#!/bin/bash

# Setup cron job for parsing monitoring on production server
# This script should be run on the server to set up the hourly parsing cron job

echo "Setting up parsing cron job for production server..."

# Get the current directory (should be the web directory)
WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_SCRIPT="$WEB_DIR/src/scripts/groq-sequential-cron.ts"

# Check if the cron script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "Error: Groq parser script not found at $CRON_SCRIPT"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "$WEB_DIR/.env.local" ]; then
    echo "Warning: .env.local not found. Make sure DATABASE_URL is set in your environment."
    echo "You can create .env.local with:"
    echo "DATABASE_URL=\"postgresql://username:password@host:port/database\""
fi

# Create logs directory if it doesn't exist
mkdir -p "$WEB_DIR/logs"

# Create the cron job entry
# The script will load environment variables from .env.local automatically
CRON_ENTRY="0 * * * * cd $WEB_DIR && npx tsx src/scripts/groq-sequential-cron.ts >> $WEB_DIR/logs/parsing-cron.log 2>&1"

# Add to crontab
echo "Adding cron job: $CRON_ENTRY"
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo "The parsing script will run every hour at minute 0"
echo "Logs will be written to: $WEB_DIR/logs/parsing-cron.log"
echo ""
echo "📋 Next steps:"
echo "1. Make sure DATABASE_URL is set in $WEB_DIR/.env.local"
echo "2. Test the script manually: cd $WEB_DIR && npx tsx src/scripts/groq-sequential-cron.ts"
echo "3. Check logs: tail -f $WEB_DIR/logs/parsing-cron.log"
echo ""
echo "To view current crontab: crontab -l"
echo "To remove the cron job: crontab -e (then delete the line)"
