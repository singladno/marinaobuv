#!/bin/bash

# Remove Fail2Ban Script
# This script safely removes Fail2Ban from the server

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
echo "Remove Fail2Ban"
echo "=========================================="
echo ""

# Check if Fail2Ban is installed
if ! command -v fail2ban-client &> /dev/null; then
    log_info "Fail2Ban is not installed"
    exit 0
fi

log_warning "This will remove Fail2Ban and unban all currently banned IPs"
echo ""

# Stop and disable Fail2Ban
log_info "Stopping Fail2Ban service..."
sudo systemctl stop fail2ban
sudo systemctl disable fail2ban
log_success "Fail2Ban stopped and disabled"

# Unban all IPs (just in case)
log_info "Unbanning all IPs..."
sudo fail2ban-client unban --all 2>/dev/null || true
log_success "All IPs unbanned"

# Remove Fail2Ban package
log_info "Removing Fail2Ban package..."
sudo apt remove --purge -y fail2ban 2>/dev/null || true
sudo apt autoremove -y 2>/dev/null || true
log_success "Fail2Ban package removed"

# Remove configuration files
log_info "Removing configuration files..."
sudo rm -rf /etc/fail2ban 2>/dev/null || true
log_success "Configuration files removed"

# Remove cron jobs related to Fail2Ban
log_info "Removing Fail2Ban cron jobs..."
crontab -l 2>/dev/null | grep -v "fail2ban\|auto-whitelist" | crontab - 2>/dev/null || true
log_success "Cron jobs removed"

echo ""
log_success "✅ Fail2Ban has been completely removed"
echo ""
log_info "Alternative security measures:"
echo "  - SSH key authentication only (already configured)"
echo "  - UFW firewall (if installed)"
echo "  - Yandex Cloud security groups"
echo "  - SSH rate limiting in sshd_config"
