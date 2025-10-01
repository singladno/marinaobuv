#!/bin/bash

# HTTPS Production Setup for MarinaObuv
# This script sets up SSL certificates and HTTPS configuration

set -e

echo "🔒 Setting up HTTPS for MarinaObuv production..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Variables
DOMAIN="marina-obuv.ru"
SSL_DIR="/etc/ssl"
NGINX_DIR="/etc/nginx"
PROJECT_DIR="/var/www/marinaobuv"

echo "🌐 Setting up HTTPS for domain: $DOMAIN"

# 1. Install required packages
echo "📦 Installing required packages..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx openssl

# 2. Create SSL directory structure
echo "📁 Creating SSL directory structure..."
sudo mkdir -p $SSL_DIR/certs
sudo mkdir -p $SSL_DIR/private
sudo chmod 755 $SSL_DIR/certs
sudo chmod 700 $SSL_DIR/private

# 3. Generate self-signed certificate for initial setup
echo "🔐 Generating self-signed SSL certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $SSL_DIR/private/marinaobuv.ru.key \
    -out $SSL_DIR/certs/marinaobuv.ru.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=MarinaObuv/OU=IT/CN=$DOMAIN"

# Set proper permissions
sudo chmod 600 $SSL_DIR/private/marinaobuv.ru.key
sudo chmod 644 $SSL_DIR/certs/marinaobuv.ru.crt

# 4. Copy nginx HTTPS configuration
echo "⚙️ Configuring Nginx for HTTPS..."
sudo cp $PROJECT_DIR/nginx/conf.d/marinaobuv-https.conf $NGINX_DIR/sites-available/marinaobuv-https

# Enable the site
sudo ln -sf $NGINX_DIR/sites-available/marinaobuv-https $NGINX_DIR/sites-enabled/
sudo rm -f $NGINX_DIR/sites-enabled/default

# 5. Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# 6. Reload nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# 7. Setup Let's Encrypt certificate (optional)
echo "🔐 Setting up Let's Encrypt certificate..."
echo "This will replace the self-signed certificate with a trusted one"
read -p "Do you want to set up Let's Encrypt certificate? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Obtaining Let's Encrypt certificate..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Setup auto-renewal
    echo "🔄 Setting up certificate auto-renewal..."
    sudo crontab -l 2>/dev/null | grep -v certbot | sudo crontab -
    echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo crontab -
fi

# 8. Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 9. Test HTTPS
echo "🧪 Testing HTTPS configuration..."
if curl -k -s -o /dev/null -w "%{http_code}" https://localhost/health | grep -q "200"; then
    echo "✅ HTTPS is working correctly!"
else
    echo "⚠️ HTTPS test failed, but configuration is set up"
fi

echo ""
echo "🎉 HTTPS setup completed!"
echo ""
echo "Your site should now be accessible at:"
echo "https://$DOMAIN"
echo "https://www.$DOMAIN"
echo ""
echo "SSL Certificate: $SSL_DIR/certs/marinaobuv.ru.crt"
echo "SSL Private Key: $SSL_DIR/private/marinaobuv.ru.key"
echo ""
echo "To check certificate status:"
echo "sudo certbot certificates"
echo ""
echo "To renew certificates manually:"
echo "sudo certbot renew"
