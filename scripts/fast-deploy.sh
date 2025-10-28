#!/bin/bash

# Fast deployment script - minimizes downtime
# This script focuses on essential updates only

set -e

echo "🚀 Starting fast deployment..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Load environment variables safely
load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "🔧 Loading environment variables from $env_file..."
        # Use a safer method that preserves quotes and handles special characters
        set -a  # automatically export all variables
        # Process the .env file line by line, handling quotes properly
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
                continue
            fi
            # Export the variable (this handles quotes correctly)
            export "$line"
        done < "$env_file"
        set +a  # turn off automatic export
    else
        echo "❌ Environment file not found: $env_file"
        exit 1
    fi
}

load_env "web/.env"

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
cd web
npm run build

# Start PM2 processes immediately
echo "🚀 Starting PM2 processes..."
cd ..
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

echo "✅ Fast deployment completed!"
echo "📊 Deployment time: $(date)"
echo "💡 Run 'npm run deploy:full' for complete deployment with SSL, cron, etc."
