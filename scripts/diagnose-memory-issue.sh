#!/bin/bash

# Diagnose Memory Issue - Find what's consuming memory

echo "🔍 Diagnosing Memory Issue..."
echo "=============================="
echo ""

# 1. Current memory status
echo "1️⃣ Memory Status:"
echo "-----------------"
free -h
echo ""

# 2. All processes sorted by memory
echo "2️⃣ All Processes (sorted by memory):"
echo "-------------------------------------"
ps aux --sort=-%mem | head -30
echo ""

# 3. Processes using significant memory (>100MB)
echo "3️⃣ Processes Using >100MB:"
echo "---------------------------"
ps aux | awk 'NR>1 {if($6 > 102400) print $2, $6/1024 "MB", $3"% CPU", $11, $12, $13, $14, $15}' | sort -k2 -rn
echo ""

# 4. Check for multiple instances of same process
echo "4️⃣ Duplicate Processes:"
echo "----------------------"
ps aux | awk '{print $11}' | sort | uniq -d | head -20
echo ""

# 5. Check systemd services
echo "5️⃣ Active Systemd Services:"
echo "---------------------------"
systemctl list-units --type=service --state=running --no-pager | head -30
echo ""

# 6. Check PM2 processes
echo "6️⃣ PM2 Processes:"
echo "----------------"
if command -v pm2 >/dev/null 2>&1; then
    pm2 list
    pm2 monit --no-interaction &
    sleep 5
    pkill -f "pm2 monit"
else
    echo "PM2 not installed or not in PATH"
fi
echo ""

# 7. Check Docker containers
echo "7️⃣ Docker Containers:"
echo "--------------------"
if command -v docker >/dev/null 2>&1; then
    docker ps -a
    docker stats --no-stream 2>/dev/null || echo "Docker stats unavailable"
else
    echo "Docker not installed"
fi
echo ""

# 8. Check for memory leaks in specific services
echo "8️⃣ Service Memory Usage:"
echo "-----------------------"
for service in nginx postgresql pm2-marinaobuv marinaobuv-boot marinaobuv-surfshark wireguard; do
    if systemctl is-active --quiet $service 2>/dev/null; then
        PID=$(systemctl show -p MainPID --value $service 2>/dev/null)
        if [ -n "$PID" ] && [ "$PID" != "0" ]; then
            MEM=$(ps -p $PID -o rss= 2>/dev/null | awk '{print $1/1024 "MB"}')
            echo "$service (PID: $PID): $MEM"
        fi
    fi
done
echo ""

# 9. Check swap usage
echo "9️⃣ Swap Status:"
echo "--------------"
swapon --show
echo ""

# 10. Check for OOM kills in logs
echo "🔟 Recent OOM Kills:"
echo "-------------------"
dmesg | grep -i "out of memory" | tail -10 || journalctl -k | grep -i "out of memory" | tail -10
echo ""

# 11. Check memory pressure
echo "1️⃣1️⃣ Memory Pressure:"
echo "-------------------"
cat /proc/pressure/memory 2>/dev/null || echo "Memory pressure stats unavailable"
echo ""

# 12. Check for zombie processes
echo "1️⃣2️⃣ Zombie Processes:"
echo "---------------------"
ps aux | grep -E "<defunct>|<zombie>" || echo "No zombie processes found"
echo ""

echo "✅ Diagnosis complete!"
echo ""
echo "💡 Look for:"
echo "   - Multiple instances of same process"
echo "   - Services using excessive memory"
echo "   - Processes that shouldn't be running"
echo "   - Memory leaks (gradually increasing memory usage)"
echo ""
