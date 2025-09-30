#!/bin/bash

# Script to run diagnostic commands on remote server
# Usage: ./scripts/remote-diagnose.sh

set -e

echo "🔍 MarinaObuv Remote Diagnostic Script"
echo "======================================"
echo ""

# SSH connection details
SSH_KEY="~/.ssh/id_rsa_marinaobuv"
SERVER="ubuntu@158.160.143.162"

echo "📡 Connecting to server and running diagnostics..."
echo ""

# Run diagnostic commands on remote server
ssh -i $SSH_KEY $SERVER << 'EOF'
set -e

echo "🔍 MarinaObuv Server Diagnostic"
echo "==============================="
echo ""

# Check directory
echo "📁 Checking directory structure..."
cd /var/www/marinaobuv
pwd
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Not in project directory"
    exit 1
fi
echo "✅ In correct directory"
echo ""

# Check Docker containers
echo "🐳 Checking Docker containers..."
docker-compose -f docker-compose.prod.yml ps
echo ""

# Check if containers are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Some containers are running"
else
    echo "❌ No containers are running"
    echo ""
    echo "📋 Attempting to start containers..."
    docker-compose -f docker-compose.prod.yml up -d
    echo "Waiting 10 seconds for containers to start..."
    sleep 10
    docker-compose -f docker-compose.prod.yml ps
fi
echo ""

# Check web service logs
echo "📋 Web service logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs web --tail=20
echo ""

# Check nginx logs
echo "📋 Nginx logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs nginx --tail=20
echo ""

# Check nginx status
echo "🔧 Checking nginx status..."
sudo systemctl status nginx --no-pager -l
echo ""

# Check ports
echo "🔌 Checking listening ports..."
sudo netstat -tlnp | grep :80 || echo "Port 80 not listening"
sudo netstat -tlnp | grep :443 || echo "Port 443 not listening"
echo ""

# Check SSL certificates
echo "🔐 Checking SSL certificates..."
if [ -f "ssl/marinaobuv.ru.crt" ] && [ -f "ssl/marinaobuv.ru.key" ]; then
    echo "✅ SSL certificates exist"
    ls -la ssl/
else
    echo "❌ SSL certificates missing"
fi
echo ""

# Check environment variables
echo "🔧 Checking environment configuration..."
if [ -f "web/.env.production" ]; then
    echo "✅ .env.production exists"
else
    echo "❌ .env.production missing"
fi
echo ""

# Test nginx configuration
echo "🔧 Testing nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    sudo nginx -t
fi
echo ""

echo "🏁 Diagnostic complete!"
echo ""
echo "📋 Summary:"
echo "- If containers are not running, check the logs above for errors"
echo "- If web service is not responding, check the web logs"
echo "- If nginx shows default page, containers might not be running"
echo "- If SSL certificates are missing, you need to set them up"
echo ""
echo "🔧 Quick fixes to try:"
echo "1. Restart containers: docker-compose -f docker-compose.prod.yml restart"
echo "2. Restart nginx: sudo systemctl restart nginx"
echo "3. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
EOF

echo ""
echo "✅ Remote diagnostic completed!"
echo "Check the output above for any issues."
