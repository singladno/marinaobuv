#!/bin/bash

# SSL Certificate Setup for MarinaObuv
# This script sets up SSL certificates using Let's Encrypt

set -e

echo "🔒 Setting up SSL certificates for MarinaObuv..."

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your domain name"
    echo "Usage: $0 marinaobuv.ru"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@$DOMAIN"

echo "🌐 Setting up SSL for domain: $DOMAIN"
echo "📧 Using email: $EMAIL"

# Stop nginx temporarily
echo "⏸️ Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# Copy certificates to project directory
echo "📁 Copying certificates to project directory..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /var/www/marinaobuv/ssl/marinaobuv.ru.crt
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /var/www/marinaobuv/ssl/marinaobuv.ru.key
sudo chown $USER:$USER /var/www/marinaobuv/ssl/*

# Setup auto-renewal
echo "🔄 Setting up certificate auto-renewal..."
sudo tee /etc/cron.d/certbot > /dev/null <<EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# Start nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx

# Test SSL
echo "🧪 Testing SSL configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ SSL setup completed successfully!"
    echo ""
    echo "Your site should now be accessible at:"
    echo "https://$DOMAIN"
    echo "https://www.$DOMAIN"
    echo ""
    echo "Certificate will auto-renew every 12 hours."
else
    echo "❌ SSL setup failed. Please check the configuration."
    exit 1
fi
