#!/bin/bash

# Fix Memory Issues on Server
# Addresses OOM (Out of Memory) problems

set -e

echo "🔧 Fixing Memory Issues..."
echo "=========================="
echo ""

# 1. Check current memory usage
echo "1️⃣ Current Memory Status:"
echo "------------------------"
free -h
echo ""

# 2. Check what's consuming memory
echo "2️⃣ Top Memory Consumers:"
echo "------------------------"
ps aux --sort=-%mem | head -15
echo ""

# 3. Check for multiple npm/node processes
echo "3️⃣ Running npm/node processes:"
echo "------------------------"
ps aux | grep -E "(npm|node)" | grep -v grep || echo "No npm/node processes found"
echo ""

# 3.5 Check for memory leaks and suspicious processes
echo "3️⃣.5 Memory-consuming processes (all):"
echo "------------------------"
ps aux --sort=-%mem | head -20
echo ""

# Check for processes consuming >500MB
echo "Processes using >500MB:"
ps aux | awk '{if($6 > 512000) print $2, $6/1024 "MB", $11}' | sort -k2 -rn || echo "None found"
echo ""

# 4. Kill any stuck npm processes
echo "4️⃣ Cleaning up stuck processes:"
echo "------------------------"
pkill -9 npm 2>/dev/null || echo "No npm processes to kill"
pkill -9 node 2>/dev/null || echo "No node processes to kill"
sleep 2
echo "✅ Cleaned up processes"
echo ""

# 5. Check swap space
echo "5️⃣ Swap Space Status:"
echo "------------------------"
swapon --show || echo "No swap configured"
echo ""

# 6. Create swap file if needed (2GB)
echo "6️⃣ Setting up swap space:"
echo "------------------------"
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1024 count=2097152
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap file created and activated"
else
    echo "Swap file exists, checking if active..."
    sudo swapon /swapfile || echo "Swap file exists but not active"
fi
echo ""

# 7. Optimize swappiness
echo "7️⃣ Optimizing swappiness:"
echo "------------------------"
echo "Current swappiness: $(cat /proc/sys/vm/swappiness)"
echo "Setting swappiness to 10 (more aggressive swapping)"
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10
echo "✅ Swappiness optimized"
echo ""

# 8. Clear caches
echo "8️⃣ Clearing system caches:"
echo "------------------------"
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null
echo "✅ Caches cleared"
echo ""

# 9. Check npm cache size
echo "9️⃣ Checking npm cache:"
echo "------------------------"
if command -v npm >/dev/null 2>&1; then
    npm cache verify 2>/dev/null || echo "npm cache check failed"
    CACHE_SIZE=$(du -sh ~/.npm 2>/dev/null | cut -f1 || echo "unknown")
    echo "npm cache size: $CACHE_SIZE"
    echo "To clean: npm cache clean --force"
fi
echo ""

# 10. Memory after cleanup
echo "🔟 Memory Status After Cleanup:"
echo "------------------------"
free -h
echo ""

echo "✅ Memory fix completed!"
echo ""
echo "💡 Recommendations:"
echo "   - Use 'npm ci --prefer-offline' to reduce memory usage"
echo "   - Consider upgrading server RAM if issues persist"
echo "   - Monitor memory usage: watch free -h"
echo ""
