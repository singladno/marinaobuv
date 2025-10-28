#!/bin/bash

# Prisma Server Script
# This script runs Prisma commands with proper environment loading for server deployment

# Load environment variables safely
load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "Using environment from $env_file..."
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
        echo "No environment file found: $env_file"
        return 1
    fi
}

# Load environment variables
if [ -f ".env.production" ]; then
    load_env ".env.production"
elif [ -f ".env.local" ]; then
    load_env ".env.local"
elif [ -f ".env" ]; then
    load_env ".env"
else
    echo "No environment file found!"
    echo "Available files:"
    ls -la .env* 2>/dev/null || echo "No .env files found"
    exit 1
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment!"
    echo "Environment variables loaded:"
    env | grep -E "(DATABASE|DB_)" || echo "No database-related environment variables found"
    exit 1
fi

echo "✅ Environment loaded successfully"
echo "Database URL: ${DATABASE_URL:0:20}..."

# Run the command passed as argument
exec "$@"
