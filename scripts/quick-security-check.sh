#!/bin/bash

# Quick Security Check - Fast scan for immediate threats

echo "🔒 Quick Security Check"
echo "======================"
echo ""

echo "1. CPU and Memory Usage:"
echo "------------------------"
top -bn1 | head -5
echo ""

echo "2. Suspicious Processes (miners):"
echo "------------------------"
ps aux | grep -iE "(miner|mine|stratum|xmrig|cpuminer|ccminer|nicehash)" | grep -v grep || echo "✅ No miner processes found"
echo ""

echo "3. Top CPU Consumers:"
echo "------------------------"
ps aux --sort=-%cpu | head -6
echo ""

echo "4. Top Memory Consumers:"
echo "------------------------"
ps aux --sort=-%mem | head -6
echo ""

echo "5. Load Average:"
echo "------------------------"
uptime
echo ""

echo "6. Suspicious Network Connections:"
echo "------------------------"
netstat -tnp 2>/dev/null | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort -u | head -10 || \
ss -tnp 2>/dev/null | grep ESTAB | awk '{print $5}' | cut -d: -f1 | sort -u | head -10
echo ""

echo "7. Suspicious Cron Jobs:"
echo "------------------------"
crontab -l 2>/dev/null | grep -iE "(miner|mine|stratum|wget|curl.*sh)" || echo "✅ No suspicious cron jobs"
echo ""

echo "8. Disk Usage:"
echo "------------------------"
df -h | head -5
echo ""

echo "✅ Quick scan completed at $(date)"
