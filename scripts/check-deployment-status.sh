#!/bin/bash

# Check Deployment Status Script
# This script checks the current status of the deployment

echo "🔍 Checking deployment status..."

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🔌 Port 3000 Status:"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"

echo ""
echo "🌍 Domain Resolution:"
nslookup marina-obuv.ru || echo "DNS resolution failed"

echo ""
echo "🔗 Nginx Configuration Test:"
sudo nginx -t

echo ""
echo "📝 Recent PM2 Logs:"
pm2 logs marinaobuv --lines 20

echo ""
echo "🧪 Health Check:"
curl -f http://localhost:3000/api/health || echo "Health check failed"

echo ""
echo "🌐 External Access Test:"
curl -f http://marina-obuv.ru/api/health || echo "External access failed"
