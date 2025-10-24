#!/bin/bash

# Setup Webhook Monitoring System
# This script sets up webhook status monitoring with notifications

set -e

echo "🚀 Setting up Webhook Monitoring System..."

# Navigate to web directory
cd /var/www/marinaobuv/web

# Add environment variables for webhook monitoring
echo "📝 Adding webhook monitoring environment variables..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Add webhook monitoring variables if they don't exist
if ! grep -q "WEBHOOK_NOTIFICATIONS_ENABLED" .env; then
    echo "" >> .env
    echo "# Webhook Status Monitoring" >> .env
    echo "WEBHOOK_NOTIFICATIONS_ENABLED=true" >> .env
    echo "WEBHOOK_NOTIFICATION_NUMBERS=+1234567890" >> .env
    echo "WEBHOOK_NOTIFICATION_MESSAGE=⚠️ Webhook Alert: Green API instance is disconnected. Please check the connection." >> .env
    echo "✅ Added webhook monitoring environment variables"
else
    echo "ℹ️  Webhook monitoring variables already exist"
fi

# Run database migration to add WebhookStatus table
echo "🗄️  Running database migration..."
npm run prisma:generate
npx prisma db push

# Add cron job for webhook monitoring (every 15 minutes)
echo "⏰ Setting up webhook monitoring cron job..."

# Create cron job entry
CRON_ENTRY="*/15 * * * * cd /var/www/marinaobuv/web && npm run webhook:monitor >> logs/webhook-monitor.log 2>&1"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "webhook:monitor"; then
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✅ Added webhook monitoring cron job (every 15 minutes)"
else
    echo "ℹ️  Webhook monitoring cron job already exists"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Test the webhook monitoring
echo "🧪 Testing webhook monitoring..."
npm run webhook:monitor

echo "✅ Webhook Monitoring System setup complete!"
echo ""
echo "📋 Configuration:"
echo "   - Monitoring runs every 15 minutes"
echo "   - Logs are saved to logs/webhook-monitor.log"
echo "   - Notifications are sent to configured phone numbers"
echo ""
echo "🔧 To configure notification numbers, edit .env file:"
echo "   WEBHOOK_NOTIFICATION_NUMBERS=+1234567890,+0987654321"
echo ""
echo "📱 To test notifications, run:"
echo "   npm run webhook:monitor"
