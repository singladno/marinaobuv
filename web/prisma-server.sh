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
else
    echo "No environment file found!"
    exit 1
fi

# Run the command passed as argument
exec "$@"
