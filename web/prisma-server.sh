#!/bin/bash

# Prisma Server Script
# This script runs Prisma commands with proper environment loading for server deployment

# Load environment variables
if [ -f ".env.production" ]; then
    echo "Using production environment..."
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
    echo "Using local environment..."
    export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "Using default environment..."
    export $(cat .env | grep -v '^#' | xargs)
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
