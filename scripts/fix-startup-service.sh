#!/bin/bash

# Fix marinaobuv-startup.service
# This script fixes the failing startup service

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
echo "Fix marinaobuv-startup.service"
echo "=========================================="
echo ""

SERVICE_FILE="/etc/systemd/system/marinaobuv-startup.service"
BOOT_SCRIPT="/var/www/marinaobuv/scripts/boot-restart.sh"
AUTO_STARTUP_SCRIPT="/var/www/marinaobuv/scripts/auto-startup.sh"

# Check if service file exists
if [ ! -f "$SERVICE_FILE" ]; then
    log_warning "Service file not found: $SERVICE_FILE"
    log_info "Creating new service file..."

    sudo tee "$SERVICE_FILE" > /dev/null <<'EOF'
[Unit]
Description=MarinaObuv Auto-Startup Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/var/www/marinaobuv
ExecStart=/bin/bash /var/www/marinaobuv/scripts/boot-restart.sh
StandardOutput=journal
StandardError=journal
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
    log_success "Service file created"
else
    log_info "Service file exists, checking configuration..."

    # Check what script it's trying to run
    CURRENT_SCRIPT=$(grep "^ExecStart=" "$SERVICE_FILE" | cut -d'=' -f2 | cut -d' ' -f1 || echo "")

    if [ -n "$CURRENT_SCRIPT" ]; then
        log_info "Current ExecStart: $CURRENT_SCRIPT"

        # Check if the script exists
        if [ ! -f "$CURRENT_SCRIPT" ]; then
            log_warning "Script not found: $CURRENT_SCRIPT"

            # Check if boot-restart.sh exists
            if [ -f "$BOOT_SCRIPT" ]; then
                log_info "Found boot-restart.sh, updating service to use it..."

                # Backup original service file
                sudo cp "$SERVICE_FILE" "${SERVICE_FILE}.backup"

                # Update service file to use boot-restart.sh
                sudo sed -i "s|ExecStart=.*|ExecStart=/bin/bash $BOOT_SCRIPT|" "$SERVICE_FILE"
                log_success "Service file updated to use boot-restart.sh"
            else
                log_error "Neither auto-startup.sh nor boot-restart.sh found!"
                log_info "Creating auto-startup.sh that calls boot-restart.sh..."

                # Create auto-startup.sh as a wrapper
                sudo tee "$AUTO_STARTUP_SCRIPT" > /dev/null <<'EOF'
#!/bin/bash
# Auto-startup wrapper script
# This script ensures the application starts on boot

cd /var/www/marinaobuv || exit 1

# Run the boot-restart script if it exists
if [ -f "scripts/boot-restart.sh" ]; then
    bash scripts/boot-restart.sh
else
    echo "boot-restart.sh not found, starting PM2 directly..."
    pm2 startOrReload ecosystem.config.js --env production || \
    pm2 start ecosystem.config.js --env production
    pm2 save
fi
EOF
                sudo chmod +x "$AUTO_STARTUP_SCRIPT"
                log_success "Created auto-startup.sh wrapper"
            fi
        else
            log_success "Script exists: $CURRENT_SCRIPT"
            # Make sure it's executable
            sudo chmod +x "$CURRENT_SCRIPT" 2>/dev/null || true
        fi
    fi
fi

# Ensure boot-restart.sh is executable
if [ -f "$BOOT_SCRIPT" ]; then
    sudo chmod +x "$BOOT_SCRIPT"
    log_success "boot-restart.sh is executable"
fi

# Reload systemd
log_info "Reloading systemd daemon..."
sudo systemctl daemon-reload
log_success "Systemd reloaded"

# Check service status
log_info "Checking service status..."
if systemctl is-enabled marinaobuv-startup.service > /dev/null 2>&1; then
    log_success "Service is enabled"
else
    log_warning "Service is not enabled, enabling it..."
    sudo systemctl enable marinaobuv-startup.service
fi

# Try to start the service
log_info "Starting service..."
if sudo systemctl start marinaobuv-startup.service; then
    sleep 2
    if systemctl is-active --quiet marinaobuv-startup.service; then
        log_success "Service started successfully!"
    else
        log_warning "Service started but may have exited (this is normal for oneshot services)"
    fi
else
    log_error "Failed to start service"
    log_info "Checking service status for details..."
    sudo systemctl status marinaobuv-startup.service --no-pager -l 10
fi

echo ""
log_info "Service configuration:"
cat "$SERVICE_FILE"
echo ""

# Final status check
echo "=========================================="
echo "Final Status"
echo "=========================================="
sudo systemctl status marinaobuv-startup.service --no-pager -l 5 || true
echo ""

log_success "✅ Startup service fix completed!"
log_info "The service should now work correctly on next boot"
