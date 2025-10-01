#!/bin/bash

# Comprehensive Domain and Server Diagnostic Script
# This script checks all aspects of the server configuration

echo "🔍 Comprehensive Server and Domain Diagnostic"
echo "=============================================="

echo ""
echo "📊 1. PM2 Application Status:"
pm2 status
echo ""

echo "📊 2. PM2 Logs (last 20 lines):"
pm2 logs marinaobuv --lines 20
echo ""

echo "📊 3. Port 3000 Status:"
netstat -tlnp | grep :3000 || echo "❌ Port 3000 not listening"
echo ""

echo "📊 4. Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""

echo "📊 5. Nginx Configuration Test:"
sudo nginx -t
echo ""

echo "📊 6. Nginx Sites Configuration:"
echo "Available sites:"
ls -la /etc/nginx/sites-available/
echo ""
echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "📊 7. Nginx Configuration Content:"
if [ -f "/etc/nginx/sites-available/marinaobuv" ]; then
    echo "✅ MarinaObuv nginx config exists:"
    cat /etc/nginx/sites-available/marinaobuv
else
    echo "❌ MarinaObuv nginx config not found!"
fi
echo ""

echo "📊 8. Local Application Test:"
curl -f http://localhost:3000/api/health || echo "❌ Local application not responding"
echo ""

echo "📊 9. Nginx Proxy Test:"
curl -f http://localhost/api/health || echo "❌ Nginx proxy not working"
echo ""

echo "📊 10. Server IP and Network:"
echo "Server IP: $(curl -s ifconfig.me)"
echo "Internal IP: $(hostname -I)"
echo ""

echo "📊 11. Firewall Status:"
sudo ufw status || echo "UFW not available"
echo ""

echo "📊 12. Open Ports:"
netstat -tlnp | grep -E ':(80|443|3000)' || echo "No relevant ports open"
echo ""

echo "📊 13. Domain Resolution Test:"
nslookup marina-obuv.ru || echo "❌ DNS resolution failed"
echo ""

echo "📊 14. External Domain Test:"
curl -f http://marina-obuv.ru/api/health || echo "❌ External domain access failed"
echo ""

echo "📊 15. Process List (relevant processes):"
ps aux | grep -E '(nginx|node|pm2)' | grep -v grep
echo ""

echo "📊 16. System Resources:"
free -h
df -h /
echo ""

echo "📊 17. Recent System Logs:"
sudo journalctl -u nginx --no-pager -l --since "10 minutes ago" | tail -20
echo ""

echo "📊 18. Network Connectivity Test:"
ping -c 3 8.8.8.8 || echo "❌ Internet connectivity issues"
echo ""

echo "🔍 Diagnostic Complete!"
echo "======================"
