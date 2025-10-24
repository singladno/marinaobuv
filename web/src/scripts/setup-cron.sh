#!/bin/bash

# Setup cron job for parsing monitoring
# This script should be run on the server to set up the hourly parsing cron job

echo "Setting up parsing cron job..."

# Get the current directory (should be the web directory)
WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_SCRIPT="$WEB_DIR/src/scripts/groq-sequential-cron.ts"

# Check if the cron script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "Error: Groq parser script not found at $CRON_SCRIPT"
    exit 1
fi

# Create the cron job entry
# Note: Make sure to set DATABASE_URL in your server's environment or .env.local file
CRON_ENTRY="0 * * * * cd $WEB_DIR && npx tsx src/scripts/groq-sequential-cron.ts >> logs/parsing-cron.log 2>&1"

# Add to crontab
echo "Adding cron job: $CRON_ENTRY"
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo "The parsing script will run every hour at minute 0"
echo "Logs will be written to: $WEB_DIR/logs/parsing-cron.log"

# Create logs directory if it doesn't exist
mkdir -p "$WEB_DIR/logs"

echo "To view current crontab: crontab -l"
echo "To remove the cron job: crontab -e (then delete the line)"
