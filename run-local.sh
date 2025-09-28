#!/bin/bash

# Local development setup script
# This script sets up the local environment to match production

echo "🚀 Setting up MarinaObuv local development environment..."

# Check if .env.local exists
if [ ! -f "web/.env.local" ]; then
    echo "❌ .env.local not found. Please create it from .env.example"
    echo "📝 Copy web/.env.example to web/.env.local and fill in your values"
    exit 1
fi

# Load environment variables
export $(cat web/.env.local | grep -v '^#' | xargs)

# Start services with Docker Compose
echo "🐳 Starting local services..."
docker-compose -f docker-compose.local.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
cd web
npm run prisma:migrate

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

echo "✅ Local development environment is ready!"
echo "🌐 Web app: http://localhost:3000"
echo "🗄️ Database: localhost:5432"
echo ""
echo "To stop services: docker-compose -f docker-compose.local.yml down"
echo "To view logs: docker-compose -f docker-compose.local.yml logs -f"
