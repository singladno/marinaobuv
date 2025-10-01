#!/bin/bash

# Fix Common Hosting Issues Script
# This script addresses common server configuration problems

set -e

echo "🔧 Fixing Common Hosting Issues"
echo "=============================="

# 1. Ensure nginx is running
echo "1. 🔄 Starting nginx service..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 2. Check and fix nginx configuration
echo "2. 🔧 Checking nginx configuration..."
if [ ! -f "/etc/nginx/sites-available/marinaobuv" ]; then
    echo "❌ Nginx config missing, copying from project..."
    sudo cp /var/www/marinaobuv/nginx/marinaobuv-pm2.conf /etc/nginx/sites-available/marinaobuv
fi

# 3. Enable the site
echo "3. 🔗 Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/marinaobuv /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test nginx configuration
echo "4. 🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# 5. Ensure PM2 is running
echo "5. 🔄 Checking PM2 status..."
if ! pm2 list | grep -q "marinaobuv.*online"; then
    echo "❌ PM2 application not running, starting..."
    cd /var/www/marinaobuv
    pm2 start ecosystem.config.js --env production
    pm2 save
else
    echo "✅ PM2 application is running"
fi

# 6. Configure firewall
echo "6. 🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 7. Check if ports are listening
echo "7. 🔌 Checking port status..."
if ! netstat -tlnp | grep -q ":80 "; then
    echo "❌ Port 80 not listening, restarting nginx..."
    sudo systemctl restart nginx
fi

if ! netstat -tlnp | grep -q ":3000"; then
    echo "❌ Port 3000 not listening, restarting PM2..."
    pm2 restart marinaobuv
fi

# 8. Test local connectivity
echo "8. 🧪 Testing local connectivity..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ Application responding on port 3000"
else
    echo "❌ Application not responding on port 3000"
    pm2 logs marinaobuv --lines 10
fi

if curl -f http://localhost/api/health; then
    echo "✅ Nginx proxy working"
else
    echo "❌ Nginx proxy not working"
    sudo nginx -t
fi

# 9. Check domain resolution
echo "9. 🌐 Checking domain resolution..."
if nslookup marina-obuv.ru; then
    echo "✅ Domain resolves correctly"
else
    echo "❌ Domain resolution failed - check DNS settings"
fi

# 10. Final status
echo "10. 📊 Final Status Check:"
echo "PM2 Status:"
pm2 status
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "Port Status:"
netstat -tlnp | grep -E ':(80|3000)'
echo ""
echo "✅ Hosting issues fix complete!"
echo "Your application should now be accessible at:"
echo "http://marina-obuv.ru"
