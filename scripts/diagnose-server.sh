#!/bin/bash

# MarinaObuv Server Diagnostic Script
# Run this on your server to diagnose deployment issues

set -e

echo "🔍 MarinaObuv Server Diagnostic Script"
echo "======================================"
echo ""

# Check if we're in the right directory
echo "📁 Checking directory structure..."
pwd
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Not in project directory. Please run: cd /var/www/marinaobuv"
    exit 1
fi
echo "✅ In correct directory"
echo ""

# Check Docker containers status
echo "🐳 Checking Docker containers..."
echo "Container status:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Check if containers are running
echo "🔍 Checking if containers are actually running..."
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

# Check if web service is responding
echo "🌐 Testing web service connectivity..."
if docker-compose -f docker-compose.prod.yml exec web curl -I http://localhost:3000 2>/dev/null | head -1; then
    echo "✅ Web service is responding"
else
    echo "❌ Web service is not responding"
fi
echo ""

# Check nginx status
echo "🔧 Checking nginx status..."
sudo systemctl status nginx --no-pager -l
echo ""

# Check ports
echo "🔌 Checking listening ports..."
echo "Port 80:"
sudo netstat -tlnp | grep :80 || echo "Port 80 not listening"
echo "Port 443:"
sudo netstat -tlnp | grep :443 || echo "Port 443 not listening"
echo "Port 3000:"
sudo netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
echo ""

# Check SSL certificates
echo "🔐 Checking SSL certificates..."
if [ -f "ssl/marinaobuv.ru.crt" ] && [ -f "ssl/marinaobuv.ru.key" ]; then
    echo "✅ SSL certificates exist"
    ls -la ssl/
else
    echo "❌ SSL certificates missing"
    echo "SSL files needed:"
    echo "  - ssl/marinaobuv.ru.crt"
    echo "  - ssl/marinaobuv.ru.key"
fi
echo ""

# Check environment variables
echo "🔧 Checking environment configuration..."
if [ -f "web/.env.production" ]; then
    echo "✅ .env.production exists"
    echo "Environment variables present:"
    grep -c "=" web/.env.production || echo "0"
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

# Check disk space
echo "💾 Checking disk space..."
df -h /
echo ""

# Check memory usage
echo "🧠 Checking memory usage..."
free -h
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
