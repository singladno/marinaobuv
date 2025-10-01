#!/bin/bash

# Quick Server Status Check
# Run this on your server to check current status

echo "🚀 Quick Server Status Check"
echo "============================="

echo ""
echo "1. PM2 Status:"
pm2 status

echo ""
echo "2. Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "3. Port Status:"
netstat -tlnp | grep -E ':(80|3000)'

echo ""
echo "4. Local App Test:"
curl -f http://localhost:3000/api/health || echo "❌ App not responding"

echo ""
echo "5. Nginx Proxy Test:"
curl -f http://localhost/api/health || echo "❌ Nginx proxy not working"

echo ""
echo "6. Domain Test:"
curl -f http://marina-obuv.ru/api/health || echo "❌ Domain not accessible"

echo ""
echo "7. Server IP:"
curl -s ifconfig.me

echo ""
echo "8. DNS Resolution:"
nslookup marina-obuv.ru

echo ""
echo "✅ Quick check complete!"
