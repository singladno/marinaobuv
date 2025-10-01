#!/bin/bash

# HTTPS Diagnostic Script for MarinaObuv
# This script checks the current HTTPS configuration and status

set -e

echo "🔍 Diagnosing HTTPS configuration for MarinaObuv..."

DOMAIN="marina-obuv.ru"

# 1. Check if nginx is running
echo "📋 Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    echo "Starting Nginx..."
    sudo systemctl start nginx
fi

# 2. Check nginx configuration
echo "⚙️ Checking Nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors:"
    sudo nginx -t
fi

# 3. Check if HTTPS is configured
echo "🔒 Checking HTTPS configuration..."
if [ -f "/etc/nginx/sites-enabled/marinaobuv-https" ]; then
    echo "✅ HTTPS configuration file exists"
else
    echo "❌ HTTPS configuration file not found"
    echo "Available sites:"
    ls -la /etc/nginx/sites-enabled/
fi

# 4. Check SSL certificates
echo "🔐 Checking SSL certificates..."
if [ -f "/etc/ssl/certs/marinaobuv.ru.crt" ]; then
    echo "✅ SSL certificate exists"
    echo "Certificate details:"
    sudo openssl x509 -in /etc/ssl/certs/marinaobuv.ru.crt -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)"
else
    echo "❌ SSL certificate not found"
fi

if [ -f "/etc/ssl/private/marinaobuv.ru.key" ]; then
    echo "✅ SSL private key exists"
else
    echo "❌ SSL private key not found"
fi

# 5. Check if ports are listening
echo "🌐 Checking port status..."
if netstat -tlnp | grep -q ":443 "; then
    echo "✅ Port 443 (HTTPS) is listening"
else
    echo "❌ Port 443 (HTTPS) is not listening"
fi

if netstat -tlnp | grep -q ":80 "; then
    echo "✅ Port 80 (HTTP) is listening"
else
    echo "❌ Port 80 (HTTP) is not listening"
fi

# 6. Check if PM2 is running the app
echo "🚀 Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "marinaobuv"; then
        echo "✅ PM2 app is running"
        pm2 list | grep marinaobuv
    else
        echo "❌ PM2 app is not running"
    fi
else
    echo "⚠️ PM2 not found"
fi

# 7. Test local HTTPS
echo "🧪 Testing local HTTPS..."
if curl -k -s -o /dev/null -w "%{http_code}" https://localhost/health 2>/dev/null | grep -q "200"; then
    echo "✅ Local HTTPS is working"
else
    echo "❌ Local HTTPS is not working"
fi

# 8. Test external HTTPS
echo "🌍 Testing external HTTPS..."
if curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null | grep -q "200"; then
    echo "✅ External HTTPS is working"
else
    echo "❌ External HTTPS is not working"
    echo "This might be due to DNS or firewall issues"
fi

# 9. Check firewall
echo "🔥 Checking firewall status..."
if command -v ufw &> /dev/null; then
    echo "UFW status:"
    sudo ufw status
else
    echo "UFW not found"
fi

# 10. Check DNS
echo "🌐 Checking DNS resolution..."
if nslookup $DOMAIN &>/dev/null; then
    echo "✅ DNS resolution working"
    nslookup $DOMAIN | grep "Address:"
else
    echo "❌ DNS resolution failed"
fi

echo ""
echo "📊 Summary:"
echo "If you see ❌ errors above, HTTPS is not properly configured."
echo "Run the setup script: ./scripts/setup-https-production.sh"
echo ""
echo "For Let's Encrypt certificate:"
echo "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
