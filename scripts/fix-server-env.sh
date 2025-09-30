#!/bin/bash

# Script to fix environment variables on server
# This will create the .env.production file with proper values

set -e

echo "🔧 Fixing environment variables on server..."

ssh -i ~/.ssh/id_rsa_marinaobuv ubuntu@158.160.143.162 << 'EOF'
set -e

echo "📁 Navigating to project directory..."
cd /var/www/marinaobuv

echo "🔧 Creating .env.production file..."

# Create .env.production with basic required variables
cat > web/.env.production << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.marina-obuv.ru
NEXT_PUBLIC_BRAND_NAME=MarinaObuv

# Database - using local PostgreSQL
DATABASE_URL=postgresql://marinaobuv:marinaobuv123@db:5432/marinaobuv
DB_USER=marinaobuv
DB_PASSWORD=marinaobuv123
DB_NAME=marinaobuv

# Authentication
NEXTAUTH_SECRET=your-secret-key-here-change-this
NEXTAUTH_URL=https://www.marina-obuv.ru

# OpenAI (you'll need to add your real keys)
OPENAI_API_KEY=your-openai-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

# S3 Storage (you'll need to add your real keys)
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET=marinaobuv-storage
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
CDN_BASE_URL=https://storage.yandexcloud.net/marinaobuv-storage

# Whapi (you'll need to add your real keys)
WHAPI_BASE_URL=https://gate.whapi.cloud
WHAPI_TOKEN=your-whapi-token
WHAPI_WEBHOOK_SECRET=your-webhook-secret
WHAPI_VERIFY_TOKEN=your-verify-token

# Yandex Cloud
YC_FOLDER_ID=your-folder-id
YC_API_KEY=your-yc-api-key

# Target Group
TARGET_GROUP_ID=your-group-id

# Processing
MESSAGE_FETCH_HOURS=24
PROCESSING_BATCH_SIZE=10
OPENAI_VISION_MODEL=gpt-4o
OPENAI_REQUEST_DELAY_MS=1000

# Session
SESSION_SECRET=your-session-secret-here

# VPN
VPN_ENABLED=false
VPN_CONFIG_PATH=/etc/wireguard/wg0.conf
ENVEOF

echo "✅ .env.production file created!"
echo "⚠️  IMPORTANT: You need to update the placeholder values with your real API keys!"
echo ""
echo "📋 Next steps:"
echo "1. Edit web/.env.production with your real API keys"
echo "2. Run: docker-compose -f docker-compose.prod.yml up -d --build"
echo "3. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
EOF

echo "✅ Environment setup script completed!"
echo ""
echo "⚠️  IMPORTANT: You need to SSH into your server and update the API keys in web/.env.production"
