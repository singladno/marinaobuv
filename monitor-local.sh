#!/bin/bash
echo "📊 MarinaObuv Local Status:"
echo "============================"

echo "PM2 Status:"
pm2 status

echo ""
echo "Application Logs (last 20 lines):"
pm2 logs marinaobuv --lines 20

echo ""
echo "System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h . | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "Application Health:"
curl -s http://localhost:3000/api/health && echo "✅ Application is healthy" || echo "❌ Application is not responding"
