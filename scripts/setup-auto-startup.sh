#!/bin/bash

# Setup Auto-Startup for MarinaObuv
# This script installs the systemd service for automatic startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 Setting up MarinaObuv Auto-Startup"
echo "====================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_status "Installing systemd service..."

# Copy service file
cp "$SCRIPT_DIR/marinaobuv-startup.service" /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable the service
systemctl enable marinaobuv-startup.service

print_success "Systemd service installed and enabled"

# Make sure the startup script is executable
chmod +x "$PROJECT_DIR/scripts/auto-startup.sh"

print_success "Startup script permissions set"

# Test the service (optional)
print_status "Testing the service..."
systemctl start marinaobuv-startup.service

# Check status
if systemctl is-active --quiet marinaobuv-startup.service; then
    print_success "✅ Service is running"
else
    print_warning "⚠️  Service may not be fully ready yet"
fi

echo ""
print_success "🎉 Auto-startup setup completed!"
echo ""
echo "📋 What was configured:"
echo "========================"
echo "✅ Systemd service: marinaobuv-startup.service"
echo "✅ Auto-startup script: $PROJECT_DIR/scripts/auto-startup.sh"
echo "✅ Service enabled for automatic startup"
echo ""
echo "🔍 Service Management Commands:"
echo "==============================="
echo "Check status: sudo systemctl status marinaobuv-startup"
echo "View logs: sudo journalctl -u marinaobuv-startup -f"
echo "Start manually: sudo systemctl start marinaobuv-startup"
echo "Stop service: sudo systemctl stop marinaobuv-startup"
echo "Disable auto-start: sudo systemctl disable marinaobuv-startup"
echo ""
echo "🚀 The service will now automatically start on VM restart!"
