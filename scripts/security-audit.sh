#!/bin/bash

# Security Audit Script - Run this immediately after logging in
# This script checks for security breaches and system issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "SECURITY AUDIT - IMMEDIATE CHECK"
echo "=========================================="
echo ""

# 1. Check for malicious processes
log_info "1. Checking for malicious processes..."
MALICIOUS=$(ps aux | grep -E "(xmrig|miner|crypto|suspicious)" | grep -v grep || true)
if [ -n "$MALICIOUS" ]; then
    log_error "⚠️  MALICIOUS PROCESSES FOUND:"
    echo "$MALICIOUS"
    echo ""
    log_warning "Killing malicious processes..."
    sudo pkill -9 xmrig 2>/dev/null || true
    sudo killall -9 xmrig 2>/dev/null || true
    sleep 2
    if ps aux | grep -E "(xmrig|miner)" | grep -v grep; then
        log_error "Failed to kill all malicious processes!"
    else
        log_success "Malicious processes killed"
    fi
else
    log_success "No obvious malicious processes found"
fi
echo ""

# 2. Check system resources
log_info "2. System Resources:"
echo "=== Memory ==="
free -h
echo ""
echo "=== Disk ==="
df -h
echo ""
echo "=== CPU Load ==="
uptime
echo ""

# 3. Check OOM killer history
log_info "3. Out of Memory (OOM) Events:"
OOM_COUNT=$(sudo dmesg | grep -i "out of memory" | wc -l)
if [ "$OOM_COUNT" -gt 0 ]; then
    log_error "Found $OOM_COUNT OOM events!"
    echo "Recent OOM events:"
    sudo dmesg | grep -i "out of memory" | tail -10
else
    log_success "No recent OOM events"
fi
echo ""

# 4. Check top memory consumers
log_info "4. Top Memory Consumers:"
ps aux --sort=-%mem | head -10
echo ""

# 5. Check network connections
log_info "5. Active Network Connections:"
sudo netstat -tulpn 2>/dev/null | head -20 || sudo ss -tulpn | head -20
echo ""

# 6. Check recent logins
log_info "6. Recent Login Activity:"
echo "=== Last 10 logins ==="
sudo last -10
echo ""
echo "=== Failed login attempts ==="
sudo grep -i "failed\|invalid" /var/log/auth.log 2>/dev/null | tail -10 || echo "No auth.log found"
echo ""

# 7. Check SSH authorized keys
log_info "7. SSH Authorized Keys:"
echo "=== User ubuntu keys ==="
cat ~/.ssh/authorized_keys 2>/dev/null || echo "No authorized_keys file"
echo ""
echo "=== Root keys ==="
sudo cat /root/.ssh/authorized_keys 2>/dev/null || echo "No root authorized_keys file"
echo ""

# 8. Check cron jobs
log_info "8. Cron Jobs (potential backdoors):"
echo "=== User crontab ==="
crontab -l 2>/dev/null || echo "No user crontab"
echo ""
echo "=== Root crontab ==="
sudo crontab -l 2>/dev/null || echo "No root crontab"
echo ""
echo "=== System cron directories ==="
sudo ls -la /etc/cron.d/ 2>/dev/null || echo "No /etc/cron.d/"
sudo ls -la /var/spool/cron/crontabs/ 2>/dev/null || echo "No crontabs directory"
echo ""

# 9. Check for suspicious files
log_info "9. Searching for suspicious files..."
echo "=== xmrig files ==="
sudo find /tmp /var/tmp /home -name "*xmrig*" -o -name "*miner*" 2>/dev/null | head -20 || echo "No obvious miner files found"
echo ""

# 10. Check systemd services
log_info "10. Failed Services:"
FAILED=$(sudo systemctl --failed --no-pager 2>/dev/null | grep -v "0 loaded" || true)
if [ -n "$FAILED" ]; then
    log_warning "Failed services found:"
    sudo systemctl --failed --no-pager
    echo ""
    log_info "Checking marinaobuv-startup.service:"
    sudo systemctl status marinaobuv-startup.service --no-pager -l 10 || true
    echo ""
    log_info "Checking openvpn@client.service:"
    sudo systemctl status openvpn@client.service --no-pager -l 10 || true
else
    log_success "No failed services"
fi
echo ""

# 11. Check system logs
log_info "11. Recent System Errors:"
sudo journalctl -p err -n 20 --no-pager 2>/dev/null | tail -20 || sudo dmesg | grep -i error | tail -10
echo ""

# 12. Check disk space
log_info "12. Disk Space Check:"
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log_error "⚠️  Disk usage critical: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "Disk usage high: ${DISK_USAGE}%"
else
    log_success "Disk usage OK: ${DISK_USAGE}%"
fi
echo ""

# Summary
echo "=========================================="
echo "SECURITY AUDIT SUMMARY"
echo "=========================================="
echo ""

THREATS_FOUND=0

if ps aux | grep -E "(xmrig|miner)" | grep -v grep > /dev/null; then
    log_error "❌ CRITICAL: Malicious processes still running!"
    THREATS_FOUND=$((THREATS_FOUND + 1))
fi

if [ "$OOM_COUNT" -gt 5 ]; then
    log_error "❌ CRITICAL: Multiple OOM events detected ($OOM_COUNT)"
    THREATS_FOUND=$((THREATS_FOUND + 1))
fi

if [ "$DISK_USAGE" -gt 90 ]; then
    log_error "❌ CRITICAL: Disk space critical"
    THREATS_FOUND=$((THREATS_FOUND + 1))
fi

if [ "$THREATS_FOUND" -eq 0 ]; then
    log_success "✅ No immediate critical threats detected"
    log_info "However, review the output above for any suspicious activity"
else
    log_error "⚠️  $THREATS_FOUND critical issue(s) detected!"
    log_warning "Immediate action required!"
fi

echo ""
echo "Audit completed at: $(date)"
echo ""
log_info "Next steps:"
echo "1. Review all output above"
echo "2. Remove any suspicious cron jobs"
echo "3. Change all passwords"
echo "4. Review and clean SSH authorized_keys"
echo "5. Update system: sudo apt update && sudo apt upgrade"
echo "6. Check firewall rules: sudo ufw status"
echo "7. Restart legitimate services"
