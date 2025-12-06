#!/bin/bash

# Comprehensive Security Scan Script
# Checks for miners, suspicious processes, and security issues

set -e

echo "🔒 Starting comprehensive security scan..."
echo "=========================================="
echo ""

# 1. Check for suspicious processes (miners, cryptominers)
echo "1️⃣ Checking for suspicious processes..."
echo "----------------------------------------"
SUSPICIOUS_KEYWORDS="minerd|cpuminer|xmrig|ccminer|stratum|mining|monero|bitcoin|ethereum|cryptocurrency|nicehash|hashrate"

echo "Checking for miner-related processes..."
ps aux | grep -iE "$SUSPICIOUS_KEYWORDS" | grep -v grep || echo "✅ No miner processes found"

echo ""
echo "Checking for processes with suspicious names..."
ps aux | awk '{print $11}' | grep -iE "(miner|mine|stratum|hash|coin)" | sort -u || echo "✅ No suspicious process names"

echo ""
echo "Top CPU-consuming processes:"
ps aux --sort=-%cpu | head -10

echo ""
echo "Top memory-consuming processes:"
ps aux --sort=-%mem | head -10

echo ""
echo ""

# 2. Check for suspicious network connections
echo "2️⃣ Checking network connections..."
echo "----------------------------------------"
echo "Active network connections:"
netstat -tulpn 2>/dev/null | head -20 || ss -tulpn 2>/dev/null | head -20

echo ""
echo "Suspicious outbound connections (mining pools, etc):"
netstat -tnp 2>/dev/null | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort -u | head -20 || \
ss -tnp 2>/dev/null | grep ESTAB | awk '{print $5}' | cut -d: -f1 | sort -u | head -20

echo ""
echo ""

# 3. Check system resource usage
echo "3️⃣ System resource usage..."
echo "----------------------------------------"
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" || echo "CPU info unavailable"

echo ""
echo "Memory Usage:"
free -h

echo ""
echo "Disk Usage:"
df -h

echo ""
echo "Load Average:"
uptime

echo ""
echo ""

# 4. Check for unauthorized users
echo "4️⃣ Checking user accounts..."
echo "----------------------------------------"
echo "All users:"
cat /etc/passwd | cut -d: -f1 | sort

echo ""
echo "Users with shell access:"
cat /etc/passwd | grep -E ":/bin/(bash|sh|zsh)" | cut -d: -f1

echo ""
echo "Recently logged in users:"
last -n 10 2>/dev/null || echo "Last command unavailable"

echo ""
echo "Currently logged in users:"
who

echo ""
echo ""

# 5. Check for suspicious cron jobs
echo "5️⃣ Checking cron jobs..."
echo "----------------------------------------"
echo "Root crontab:"
crontab -l 2>/dev/null || echo "No root crontab"

echo ""
echo "All user crontabs:"
for user in $(cut -f1 -d: /etc/passwd); do
  crontab -u "$user" -l 2>/dev/null && echo "--- Crontab for user: $user ---" || true
done

echo ""
echo "System cron jobs:"
ls -la /etc/cron.* 2>/dev/null | head -20 || echo "No system cron directories"

echo ""
echo ""

# 6. Check for suspicious files and directories
echo "6️⃣ Checking for suspicious files..."
echo "----------------------------------------"
echo "Checking /tmp for suspicious files:"
find /tmp -type f -name "*miner*" -o -name "*mine*" -o -name "*stratum*" 2>/dev/null || echo "✅ No suspicious files in /tmp"

echo ""
echo "Checking /var/tmp:"
find /var/tmp -type f -name "*miner*" -o -name "*mine*" 2>/dev/null || echo "✅ No suspicious files in /var/tmp"

echo ""
echo "Checking for hidden files in home directories:"
find /home -name ".*" -type f -size +1M 2>/dev/null | head -20 || echo "No large hidden files found"

echo ""
echo ""

# 7. Check for suspicious systemd services
echo "7️⃣ Checking systemd services..."
echo "----------------------------------------"
echo "All active services:"
systemctl list-units --type=service --state=running 2>/dev/null | grep -iE "(miner|mine|stratum)" || echo "✅ No suspicious services"

echo ""
echo "Failed services:"
systemctl list-units --type=service --state=failed 2>/dev/null | head -10

echo ""
echo ""

# 8. Check for suspicious kernel modules
echo "8️⃣ Checking kernel modules..."
echo "----------------------------------------"
lsmod | grep -iE "(miner|mine|stratum)" || echo "✅ No suspicious kernel modules"

echo ""
echo ""

# 9. Check file integrity (SUID/SGID files)
echo "9️⃣ Checking for SUID/SGID files..."
echo "----------------------------------------"
find /usr /bin /sbin -perm -4000 -o -perm -2000 2>/dev/null | head -20

echo ""
echo ""

# 10. Check for suspicious processes running as root
echo "🔟 Checking root processes..."
echo "----------------------------------------"
ps aux | grep "^root" | grep -vE "(systemd|kernel|init)" | head -20

echo ""
echo ""

# 11. Check disk I/O
echo "1️⃣1️⃣ Checking disk I/O..."
echo "----------------------------------------"
iostat -x 1 2 2>/dev/null || echo "iostat not available, checking with other tools..."
iotop -b -n 1 2>/dev/null | head -10 || echo "iotop not available"

echo ""
echo ""

# 12. Check for suspicious scripts
echo "1️⃣2️⃣ Checking for suspicious scripts..."
echo "----------------------------------------"
echo "Scripts in common locations:"
find /usr/local/bin /opt /root -name "*.sh" -type f 2>/dev/null | head -20

echo ""
echo ""

# Summary
echo "=========================================="
echo "📊 Security Scan Summary"
echo "=========================================="
echo ""
echo "✅ Scan completed at $(date)"
echo ""
echo "⚠️  If you see suspicious processes, high CPU/memory usage, or unknown users,"
echo "   investigate further. Check the output above for any red flags."
echo ""
echo "💡 Recommended actions if issues found:"
echo "   1. Kill suspicious processes"
echo "   2. Remove unauthorized users"
echo "   3. Clean up suspicious cron jobs"
echo "   4. Check and remove suspicious files"
echo "   5. Review network connections"
echo ""
