#!/bin/bash

# Complete Server Fix Script
# This script will diagnose and fix all common hosting issues

set -e

echo "🚀 Complete Server Fix Script"
echo "============================="
echo "This script will diagnose and fix all common issues"
echo ""

# Function to print status
print_status() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_info() {
    echo "ℹ️  $1"
}

# 1. Check current status
echo "📊 STEP 1: Current Status Check"
echo "==============================="

echo ""
print_info "Checking PM2 status..."
pm2 status

echo ""
print_info "Checking nginx status..."
sudo systemctl status nginx --no-pager -l

echo ""
print_info "Checking ports..."
netstat -tlnp | grep -E ':(80|443|3000)' || print_error "No relevant ports open"

echo ""
print_info "Checking server IP..."
SERVER_IP=$(curl -s ifconfig.me)
echo "Server IP: $SERVER_IP"

echo ""
print_info "Checking domain resolution..."
nslookup marina-obuv.ru || print_error "DNS resolution failed"

# 2. Fix PM2 issues
echo ""
echo "🔧 STEP 2: Fixing PM2 Issues"
echo "============================"

# Check if PM2 app is running
if ! pm2 list | grep -q "marinaobuv.*online"; then
    print_error "PM2 application not running, starting..."
    cd /var/www/marinaobuv
    pm2 start ecosystem.config.js --env production
    pm2 save
    print_status "PM2 application started"
else
    print_status "PM2 application is running"
fi

# 3. Fix nginx issues
echo ""
echo "🔧 STEP 3: Fixing Nginx Issues"
echo "============================="

# Ensure nginx is running
sudo systemctl start nginx
sudo systemctl enable nginx

# Check if nginx config exists
if [ ! -f "/etc/nginx/sites-available/marinaobuv" ]; then
    print_error "Nginx config missing, creating..."
    sudo cp /var/www/marinaobuv/nginx/marinaobuv-pm2.conf /etc/nginx/sites-available/marinaobuv
    print_status "Nginx config created"
fi

# Enable the site
sudo ln -sf /etc/nginx/sites-available/marinaobuv /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
print_status "Nginx site enabled"

# Test nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# 4. Fix firewall issues
echo ""
echo "🔧 STEP 4: Fixing Firewall Issues"
echo "================================"

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
print_status "Firewall configured"

# 5. Test connectivity
echo ""
echo "🧪 STEP 5: Testing Connectivity"
echo "=============================="

# Test local application
if curl -f http://localhost:3000/api/health; then
    print_status "Application responding on port 3000"
else
    print_error "Application not responding on port 3000"
    print_info "PM2 logs:"
    pm2 logs marinaobuv --lines 10
fi

# Test nginx proxy
if curl -f http://localhost/api/health; then
    print_status "Nginx proxy working"
else
    print_error "Nginx proxy not working"
    print_info "Nginx error logs:"
    sudo tail -20 /var/log/nginx/error.log
fi

# Test domain
if curl -f http://marina-obuv.ru/api/health; then
    print_status "Domain accessible externally"
else
    print_error "Domain not accessible externally"
fi

# 6. Final diagnostics
echo ""
echo "📊 STEP 6: Final Diagnostics"
echo "============================"

echo ""
print_info "PM2 Status:"
pm2 status

echo ""
print_info "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
print_info "Port Status:"
netstat -tlnp | grep -E ':(80|3000)'

echo ""
print_info "Nginx Configuration:"
sudo nginx -t

echo ""
print_info "Domain Resolution:"
nslookup marina-obuv.ru

echo ""
print_info "External Test:"
curl -f http://marina-obuv.ru/api/health || print_error "External access failed"

echo ""
echo "🎉 Complete Server Fix Finished!"
echo "================================"
echo ""
echo "Your application should now be accessible at:"
echo "http://marina-obuv.ru"
echo ""
echo "If it's still not working, the issue might be:"
echo "1. DNS configuration (domain not pointing to server IP: $SERVER_IP)"
echo "2. Cloud provider firewall/security groups"
echo "3. Domain registrar settings"
echo ""
echo "Server IP: $SERVER_IP"
echo "Make sure your domain DNS A record points to this IP address."
