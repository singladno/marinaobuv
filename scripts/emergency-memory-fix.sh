#!/bin/bash

# Emergency Memory Fix - Run this FIRST
# Kills stuck processes and adds swap immediately

set -e

echo "🚨 EMERGENCY MEMORY FIX"
echo "========================"
echo ""

# 1. Kill ALL npm/node processes immediately
echo "1️⃣ Killing stuck npm/node processes..."
echo "--------------------------------------"
pkill -9 npm 2>/dev/null && echo "✅ Killed npm processes" || echo "No npm processes found"
pkill -9 node 2>/dev/null && echo "✅ Killed node processes" || echo "No node processes found"
sleep 2
echo ""

# 2. Check current memory
echo "2️⃣ Current Memory Status:"
echo "------------------------"
free -h
echo ""

# 3. Create swap file IMMEDIATELY (2GB)
echo "3️⃣ Creating 2GB swap file..."
echo "----------------------------"
if [ ! -f /swapfile ]; then
    echo "Creating swap file..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap file created and activated"
else
    echo "Swap file exists, activating..."
    sudo swapon /swapfile 2>/dev/null || echo "Swap already active or error"
fi
echo ""

# 4. Verify swap is active
echo "4️⃣ Swap Status:"
echo "---------------"
swapon --show
free -h
echo ""

# 5. Optimize swappiness
echo "5️⃣ Optimizing swappiness..."
echo "---------------------------"
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10
echo "✅ Swappiness set to 10"
echo ""

# 6. Clear caches
echo "6️⃣ Clearing system caches..."
echo "---------------------------"
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null
free -h
echo ""

# 7. Check what's still consuming memory
echo "7️⃣ Current Memory Consumers:"
echo "----------------------------"
ps aux --sort=-%mem | head -10
echo ""

echo "✅ Emergency fix completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Wait a few minutes for system to stabilize"
echo "   2. Check memory: free -h"
echo "   3. If stable, try deployment again"
echo ""
