#!/bin/bash

# Server Status Diagnostic Script
# Run this via GitHub Actions or console to diagnose server issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo "Server Status Diagnostic"
echo "=========================================="
echo ""

# 1. System Information
log_info "1. System Information"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo ""

# 2. System Resources
log_info "2. System Resources"
echo "=== Disk Usage ==="
df -h | grep -E "(Filesystem|/dev/)"
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== CPU Load ==="
top -bn1 | grep "Cpu(s)" | awk '{print "CPU Usage: " $2}'
loadavg=$(uptime | awk -F'load average:' '{print $2}')
echo "Load Average:$loadavg"
echo ""

# 3. Network Status
log_info "3. Network Status"
echo "=== Network Interfaces ==="
ip addr show | grep -E "(inet |inet6 )" | grep -v "127.0.0.1" | head -5
echo ""
echo "=== Listening Ports ==="
sudo ss -tlnp | grep -E ":(22|80|443|3000)" || echo "No relevant ports found"
echo ""

# 4. SSH Service Status
log_info "4. SSH Service Status"
if systemctl is-active --quiet ssh || systemctl is-active --quiet sshd; then
    log_success "SSH service is running"
    systemctl status ssh --no-pager -l 5 || systemctl status sshd --no-pager -l 5
else
    log_error "SSH service is NOT running"
    systemctl status ssh --no-pager -l 10 || systemctl status sshd --no-pager -l 10
fi
echo ""

# 5. SSH Configuration
log_info "5. SSH Configuration Check"
if [ -f /etc/ssh/sshd_config ]; then
    echo "SSH Port: $(sudo grep -E '^Port' /etc/ssh/sshd_config || echo 'Port 22 (default)')"
    echo "Password Auth: $(sudo grep -E '^PasswordAuthentication' /etc/ssh/sshd_config || echo 'Not set (default: yes)')"
    echo "Pubkey Auth: $(sudo grep -E '^PubkeyAuthentication' /etc/ssh/sshd_config || echo 'Not set (default: yes)')"
    echo "Max Startups: $(sudo grep -E '^MaxStartups' /etc/ssh/sshd_config || echo 'Not set (default: 10:30:100)')"
else
    log_warning "SSH config file not found"
fi
echo ""

# 6. SSH Recent Logs
log_info "6. SSH Recent Activity (last 20 lines)"
if [ -f /var/log/auth.log ]; then
    sudo tail -20 /var/log/auth.log | grep -E "(ssh|Accepted|Failed|refused)" || echo "No recent SSH activity"
elif [ -f /var/log/secure ]; then
    sudo tail -20 /var/log/secure | grep -E "(ssh|Accepted|Failed|refused)" || echo "No recent SSH activity"
else
    log_warning "Auth log file not found"
fi
echo ""

# 7. Firewall Status
log_info "7. Firewall Status"
if command -v ufw &> /dev/null; then
    echo "=== UFW Status ==="
    sudo ufw status verbose || echo "UFW not configured"
elif command -v firewall-cmd &> /dev/null; then
    echo "=== Firewalld Status ==="
    sudo firewall-cmd --list-all || echo "Firewalld not active"
else
    echo "=== iptables Rules ==="
    sudo iptables -L -n -v --line-numbers | head -20 || echo "iptables not configured"
fi
echo ""

# 8. Nginx Status
log_info "8. Nginx Status"
if systemctl is-active --quiet nginx; then
    log_success "Nginx is running"
    systemctl status nginx --no-pager -l 5
else
    log_error "Nginx is NOT running"
    systemctl status nginx --no-pager -l 10
fi
echo ""

# 9. PM2 Status
log_info "9. PM2 Processes"
if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    echo "=== PM2 Process Details ==="
    pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) - CPU: \(.monit.cpu)% MEM: \(.monit.memory/1024/1024)MB"' 2>/dev/null || pm2 list
else
    log_warning "PM2 not found"
fi
echo ""

# 10. Application Health
log_info "10. Application Health Checks"
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log_success "Application health check passed"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
else
    log_error "Application health check failed"
    echo "Checking if port 3000 is listening..."
    sudo ss -tlnp | grep 3000 || echo "Port 3000 is not listening"
fi
echo ""

# 11. Database Status
log_info "11. Database Status"
if systemctl is-active --quiet postgresql || systemctl is-active --quiet postgresql@*; then
    log_success "PostgreSQL service is running"
    if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
        log_success "PostgreSQL is accessible"
    else
        log_warning "PostgreSQL service running but not accessible"
    fi
else
    log_error "PostgreSQL service is NOT running"
fi
echo ""

# 12. Recent System Errors
log_info "12. Recent System Errors (last 30 lines)"
sudo journalctl -p err -n 30 --no-pager 2>/dev/null || sudo dmesg | grep -i error | tail -10
echo ""

# 13. System Load and Processes
log_info "13. Top Processes by CPU"
top -bn1 | head -15
echo ""

log_info "14. Top Processes by Memory"
ps aux --sort=-%mem | head -10
echo ""

# 15. Network Connections
log_info "15. Active Network Connections"
sudo ss -tnp | head -20
echo ""

# Summary
echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""

# Check critical services
all_ok=true

if ! systemctl is-active --quiet ssh && ! systemctl is-active --quiet sshd; then
    log_error "❌ SSH service is down"
    all_ok=false
else
    log_success "✅ SSH service is running"
fi

if ! systemctl is-active --quiet nginx; then
    log_error "❌ Nginx is down"
    all_ok=false
else
    log_success "✅ Nginx is running"
fi

if ! curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log_error "❌ Application is not responding"
    all_ok=false
else
    log_success "✅ Application is responding"
fi

# Check disk space
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    log_error "❌ Disk usage is critical: ${disk_usage}%"
    all_ok=false
elif [ "$disk_usage" -gt 80 ]; then
    log_warning "⚠️  Disk usage is high: ${disk_usage}%"
else
    log_success "✅ Disk usage is healthy: ${disk_usage}%"
fi

# Check memory
memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$memory_usage" -gt 90 ]; then
    log_error "❌ Memory usage is critical: ${memory_usage}%"
    all_ok=false
elif [ "$memory_usage" -gt 80 ]; then
    log_warning "⚠️  Memory usage is high: ${memory_usage}%"
else
    log_success "✅ Memory usage is healthy: ${memory_usage}%"
fi

echo ""
if [ "$all_ok" = true ]; then
    log_success "🎉 All critical checks passed!"
else
    log_error "❌ Some issues detected. Review the output above."
fi

echo ""
echo "Diagnostic completed at: $(date)"
