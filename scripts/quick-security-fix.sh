#!/bin/bash

# Quick Security Fix Script
# Run this immediately after security audit to fix critical issues

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
echo "QUICK SECURITY FIX"
echo "=========================================="
echo ""

# 1. Remove miner service
log_info "1. Removing cryptocurrency miner service..."
if systemctl list-units --all | grep -q c3pool_miner; then
    sudo systemctl stop c3pool_miner.service 2>/dev/null || true
    sudo systemctl disable c3pool_miner.service 2>/dev/null || true
    sudo systemctl mask c3pool_miner.service 2>/dev/null || true
    if [ -f /etc/systemd/system/c3pool_miner.service ]; then
        sudo rm -f /etc/systemd/system/c3pool_miner.service
        log_success "Miner service file removed"
    fi
    sudo systemctl daemon-reload
    log_success "Miner service disabled and removed"
else
    log_success "No miner service found (already removed?)"
fi
echo ""

# 2. Search for miner files
log_info "2. Searching for miner-related files..."
MINER_FILES=$(sudo find /tmp /var/tmp /home /root -type f \( -name "*xmrig*" -o -name "*c3pool*" -o -name "*miner*" \) 2>/dev/null | head -10 || true)
if [ -n "$MINER_FILES" ]; then
    log_warning "Found miner-related files:"
    echo "$MINER_FILES"
    log_warning "Review and remove these files manually"
else
    log_success "No obvious miner files found in common locations"
fi
echo ""

# 3. Block attacking IPs
log_info "3. Blocking known attacking IPs..."
sudo ufw deny from 159.223.2.190 2>/dev/null && log_success "Blocked 159.223.2.190" || log_warning "Could not block 159.223.2.190 (may already be blocked)"
sudo ufw deny from 161.35.146.183 2>/dev/null && log_success "Blocked 161.35.146.183" || log_warning "Could not block 161.35.146.183 (may already be blocked)"
echo ""

# 4. Install Fail2Ban
log_info "4. Installing and configuring Fail2Ban..."
if ! command -v fail2ban-client &> /dev/null; then
    sudo apt update -qq
    sudo apt install -y fail2ban
    log_success "Fail2Ban installed"

    # Basic configuration
    if [ ! -f /etc/fail2ban/jail.local ]; then
        sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
        log_success "Fail2Ban configuration created"
    fi

    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    log_success "Fail2Ban started"
else
    log_success "Fail2Ban already installed"
    sudo systemctl restart fail2ban 2>/dev/null || true
fi
echo ""

# 5. Fix marinaobuv-startup.service
log_info "5. Checking marinaobuv-startup.service..."
if [ -f /etc/systemd/system/marinaobuv-startup.service ]; then
    STARTUP_SCRIPT=$(grep "ExecStart=" /etc/systemd/system/marinaobuv-startup.service | cut -d'=' -f2 | cut -d' ' -f1)
    if [ -f "$STARTUP_SCRIPT" ]; then
        sudo chmod +x "$STARTUP_SCRIPT"
        log_success "Startup script permissions fixed"
        sudo systemctl daemon-reload
        sudo systemctl restart marinaobuv-startup.service 2>/dev/null || log_warning "Could not restart startup service (may need manual fix)"
    else
        log_warning "Startup script not found: $STARTUP_SCRIPT"
        log_info "You may need to fix the service file manually"
    fi
else
    log_warning "marinaobuv-startup.service not found"
fi
echo ""

# 6. Start PM2 application
log_info "6. Starting PM2 application..."
cd /var/www/marinaobuv 2>/dev/null || {
    log_error "Cannot access /var/www/marinaobuv"
    echo ""
    exit 1
}

if command -v pm2 &> /dev/null; then
    # Check if PM2 processes are running
    if pm2 list | grep -q "online"; then
        log_success "PM2 processes already running"
        pm2 list
    else
        if [ -f ecosystem.config.js ]; then
            pm2 startOrReload ecosystem.config.js --env production 2>/dev/null || \
            pm2 start ecosystem.config.js --env production
            pm2 save
            log_success "PM2 application started"
        else
            log_warning "ecosystem.config.js not found"
        fi
    fi
else
    log_warning "PM2 not found - install with: sudo npm install -g pm2"
fi
echo ""

# 7. Start Nginx
log_info "7. Starting Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx is already running"
else
    sudo systemctl start nginx
    sudo systemctl enable nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx started"
    else
        log_error "Failed to start Nginx - check logs: sudo journalctl -u nginx"
    fi
fi
echo ""

# 8. Verify application health
log_info "8. Verifying application health..."
sleep 2
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log_success "Application is responding"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
else
    log_warning "Application is not responding on port 3000"
    log_info "Check PM2 logs: pm2 logs"
fi
echo ""

# 9. Check firewall status
log_info "9. Checking firewall status..."
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        log_success "UFW firewall is active"
        sudo ufw status numbered | head -10
    else
        log_warning "UFW firewall is not active"
        log_info "Enable with: sudo ufw enable"
    fi
else
    log_warning "UFW not installed"
fi
echo ""

# Summary
echo "=========================================="
echo "QUICK FIX SUMMARY"
echo "=========================================="
echo ""
log_success "✅ Security fixes applied"
echo ""
log_info "Next steps:"
echo "1. Review SECURITY_RECOMMENDATIONS.md for detailed actions"
echo "2. Change all passwords: passwd"
echo "3. Update system: sudo apt update && sudo apt upgrade"
echo "4. Review SSH keys: cat ~/.ssh/authorized_keys"
echo "5. Monitor system: pm2 logs, sudo journalctl -f"
echo ""
log_warning "⚠️  IMPORTANT: Review and remove any miner files found above"
echo ""
echo "Fix completed at: $(date)"
