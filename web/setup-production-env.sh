#!/bin/bash

# Setup Production Environment Script
# This script helps set up the production environment file

echo "🚀 Setting up production environment..."

# Check if .env.production already exists
if [ -f ".env.production" ]; then
    echo "⚠️  .env.production already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Copy template to production
if [ -f ".env.production.template" ]; then
    cp .env.production.template .env.production
    echo "✅ Created .env.production from template"
else
    echo "❌ .env.production.template not found"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env.production with your actual production values"
echo "2. Set up your production database"
echo "3. Run: npm run prisma:deploy (to run migrations)"
echo "4. Run: npm run prisma:seed (to seed the database)"
echo ""
echo "🔧 Required environment variables:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - WHAPI_TOKEN (WhatsApp API token)"
echo "   - S3_* (S3 configuration)"
echo "   - YC_* (Yandex Cloud configuration)"
echo "   - SMS_API_KEY (SMS service API key)"
echo ""
echo "✅ Production environment setup complete!"
