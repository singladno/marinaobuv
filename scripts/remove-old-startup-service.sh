#!/bin/bash

# Remove old/unused marinaobuv-startup.service
# This service is redundant - marinaobuv-boot.service handles boot recovery

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
echo "Remove Old marinaobuv-startup.service"
echo "=========================================="
echo ""

OLD_SERVICE="marinaobuv-startup.service"
CURRENT_SERVICE="marinaobuv-boot.service"
SERVICE_FILE="/etc/systemd/system/marinaobuv-startup.service"

# Check if old service exists
if [ -f "$SERVICE_FILE" ]; then
    log_info "Found old service: $OLD_SERVICE"

    # Show what it's trying to do
    log_info "Service configuration:"
    cat "$SERVICE_FILE"
    echo ""

    # Check if current service exists
    if systemctl list-unit-files | grep -q "$CURRENT_SERVICE"; then
        log_success "Found current service: $CURRENT_SERVICE"
        log_info "The old service is redundant - marinaobuv-boot.service handles boot recovery"
    else
        log_warning "Current service ($CURRENT_SERVICE) not found"
        log_info "It will be created by boot-restart.sh on next run"
    fi

    # Stop and disable old service
    log_info "Stopping and disabling old service..."
    sudo systemctl stop "$OLD_SERVICE" 2>/dev/null || true
    sudo systemctl disable "$OLD_SERVICE" 2>/dev/null || true
    sudo systemctl mask "$OLD_SERVICE" 2>/dev/null || true
    log_success "Old service stopped and disabled"

    # Remove service file
    log_info "Removing service file..."
    sudo rm -f "$SERVICE_FILE"
    log_success "Service file removed"

    # Reload systemd
    sudo systemctl daemon-reload
    log_success "Systemd reloaded"

else
    log_success "Old service file not found (already removed?)"
fi

# Verify removal
echo ""
log_info "Verifying removal..."
if systemctl list-units --all | grep -q "$OLD_SERVICE"; then
    log_warning "Service still shows in systemd (may need reboot)"
    systemctl list-units --all | grep "$OLD_SERVICE"
else
    log_success "Service successfully removed"
fi

# Check current service status
echo ""
log_info "Current boot service status:"
if systemctl list-unit-files | grep -q "$CURRENT_SERVICE"; then
    systemctl status "$CURRENT_SERVICE" --no-pager -l 3 || true
    if systemctl is-enabled "$CURRENT_SERVICE" > /dev/null 2>&1; then
        log_success "✅ $CURRENT_SERVICE is enabled and will run on boot"
    else
        log_warning "⚠️  $CURRENT_SERVICE exists but is not enabled"
        log_info "It will be enabled by boot-restart.sh"
    fi
else
    log_info "ℹ️  $CURRENT_SERVICE will be created by boot-restart.sh when it runs"
fi

# Check PM2 startup
echo ""
log_info "PM2 startup configuration:"
if command -v pm2 &> /dev/null; then
    pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || log_info "PM2 startup already configured or needs manual setup"
else
    log_warning "PM2 not found"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
log_success "✅ Old marinaobuv-startup.service removed"
log_info ""
log_info "Boot recovery is handled by:"
log_info "  - marinaobuv-boot.service (runs boot-restart.sh)"
log_info "  - PM2 startup (via 'pm2 startup' command)"
log_info ""
log_info "The old service was redundant and broken (missing auto-startup.sh script)"
log_info "You should no longer see it in 'systemctl --failed'"
echo ""
