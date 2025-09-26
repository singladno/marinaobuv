#!/bin/bash

# Deployment script for MarinaObuv
# Run this script to deploy the application

set -e

echo "🚀 Deploying MarinaObuv to Russian server..."

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and fill in your values"
    exit 1
fi

# Load environment variables
source .env.production

echo "📦 Building and starting containers..."

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start new containers
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec web npm run prisma:migrate

# Seed database if needed
echo "🌱 Seeding database..."
docker-compose -f docker-compose.prod.yml exec web npm run prisma:seed

# Restart nginx
echo "🌐 Restarting Nginx..."
sudo systemctl reload nginx

# Show running containers
echo "📊 Current container status:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed!"
echo ""
echo "Your application should now be running at:"
echo "http://$(curl -s ifconfig.me)"
echo ""
echo "To check logs:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
