#!/bin/bash

# Complete OpenVPN Removal Script
# This script removes all OpenVPN components from the system

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
echo "OpenVPN Removal Script"
echo "=========================================="
echo ""

# 1. Stop and disable all OpenVPN services
log_info "1. Stopping and disabling OpenVPN services..."

SERVICES=(
    "openvpn@client.service"
    "openvpn.service"
    "openvpnas.service"
    "openvpn-access-server.service"
)

for svc in "${SERVICES[@]}"; do
    if systemctl list-units --all | grep -q "$svc"; then
        log_info "Stopping $svc..."
        sudo systemctl stop "$svc" 2>/dev/null || true
        sudo systemctl disable "$svc" 2>/dev/null || true
        sudo systemctl mask "$svc" 2>/dev/null || true
        log_success "Disabled $svc"
    fi
done

# Check for any OpenVPN systemd services
OPENVPN_SERVICES=$(systemctl list-units --all --type=service | grep -i openvpn | awk '{print $1}' || true)
if [ -n "$OPENVPN_SERVICES" ]; then
    log_warning "Found additional OpenVPN services:"
    echo "$OPENVPN_SERVICES"
    for svc in $OPENVPN_SERVICES; do
        sudo systemctl stop "$svc" 2>/dev/null || true
        sudo systemctl disable "$svc" 2>/dev/null || true
        log_info "Disabled $svc"
    done
fi

echo ""

# 2. Kill any running OpenVPN processes
log_info "2. Killing any running OpenVPN processes..."
OPENVPN_PIDS=$(pgrep -f openvpn || true)
if [ -n "$OPENVPN_PIDS" ]; then
    log_warning "Found running OpenVPN processes, killing them..."
    sudo pkill -9 -f openvpn || true
    sleep 2
    if pgrep -f openvpn > /dev/null; then
        log_error "Some OpenVPN processes are still running"
    else
        log_success "All OpenVPN processes stopped"
    fi
else
    log_success "No running OpenVPN processes found"
fi
echo ""

# 3. Remove OpenVPN packages
log_info "3. Removing OpenVPN packages..."

# Remove OpenVPN Access Server
if dpkg -l | grep -q openvpn-as; then
    log_info "Removing openvpn-as (OpenVPN Access Server)..."
    sudo apt-get remove --purge -y openvpn-as 2>/dev/null || true
    log_success "Removed openvpn-as"
fi

# Remove standard OpenVPN client
if dpkg -l | grep -q "^ii.*openvpn "; then
    log_info "Removing openvpn client..."
    sudo apt-get remove --purge -y openvpn 2>/dev/null || true
    log_success "Removed openvpn"
fi

# Remove any remaining OpenVPN packages
OPENVPN_PKGS=$(dpkg -l | grep -i openvpn | awk '{print $2}' || true)
if [ -n "$OPENVPN_PKGS" ]; then
    log_info "Removing remaining OpenVPN packages: $OPENVPN_PKGS"
    sudo apt-get remove --purge -y $OPENVPN_PKGS 2>/dev/null || true
fi

# Clean up dependencies
sudo apt-get autoremove -y 2>/dev/null || true
log_success "Package removal completed"
echo ""

# 4. Remove OpenVPN configuration files
log_info "4. Removing OpenVPN configuration files..."

CONFIG_DIRS=(
    "/etc/openvpn"
    "/usr/local/openvpn_as"
    "/var/log/openvpn"
)

for dir in "${CONFIG_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log_info "Removing $dir..."
        sudo rm -rf "$dir"
        log_success "Removed $dir"
    fi
done

# Remove individual config files
CONFIG_FILES=(
    "/etc/openvpn/client.conf"
    "/etc/openvpn/server.conf"
    "/etc/openvpn/ta.key"
    "/etc/systemd/system/openvpn@.service"
    "/etc/systemd/system/openvpn.service"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ] || [ -d "$file" ]; then
        log_info "Removing $file..."
        sudo rm -rf "$file"
        log_success "Removed $file"
    fi
done

echo ""

# 5. Remove OpenVPN repository
log_info "5. Removing OpenVPN repository..."

REPO_FILES=(
    "/etc/apt/sources.list.d/openvpn-as.list"
    "/usr/share/keyrings/openvpn-as.gpg"
)

for file in "${REPO_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_info "Removing $file..."
        sudo rm -f "$file"
        log_success "Removed $file"
    fi
done

# Update apt cache
sudo apt-get update -qq 2>/dev/null || true
log_success "Repository removed"
echo ""

# 6. Remove OpenVPN user (if exists)
log_info "6. Checking for OpenVPN user..."
if id "openvpn" &>/dev/null; then
    log_warning "OpenVPN user exists. Removing..."
    sudo userdel -r openvpn 2>/dev/null || sudo userdel openvpn 2>/dev/null || true
    log_success "OpenVPN user removed"
else
    log_success "No OpenVPN user found"
fi
echo ""

# 7. Remove OpenVPN from systemd
log_info "7. Cleaning up systemd references..."
sudo systemctl daemon-reload
log_success "Systemd reloaded"
echo ""

# 8. Check for any remaining OpenVPN files
log_info "8. Searching for any remaining OpenVPN files..."
REMAINING_FILES=$(sudo find /etc /usr /var -name "*openvpn*" 2>/dev/null | head -20 || true)
if [ -n "$REMAINING_FILES" ]; then
    log_warning "Found remaining OpenVPN-related files:"
    echo "$REMAINING_FILES"
    log_info "Review these files and remove manually if needed"
else
    log_success "No remaining OpenVPN files found"
fi
echo ""

# 9. Verify removal
log_info "9. Verifying removal..."

# Check services
if systemctl list-units --all | grep -qi openvpn; then
    log_warning "Some OpenVPN services still exist:"
    systemctl list-units --all | grep -i openvpn
else
    log_success "No OpenVPN services found"
fi

# Check packages
if dpkg -l | grep -qi openvpn; then
    log_warning "Some OpenVPN packages still installed:"
    dpkg -l | grep -i openvpn
else
    log_success "No OpenVPN packages found"
fi

# Check processes
if pgrep -f openvpn > /dev/null; then
    log_warning "OpenVPN processes still running:"
    ps aux | grep -i openvpn | grep -v grep
else
    log_success "No OpenVPN processes running"
fi

echo ""

# Summary
echo "=========================================="
echo "OpenVPN Removal Summary"
echo "=========================================="
echo ""
log_success "✅ OpenVPN removal completed!"
echo ""
log_info "Next steps:"
echo "1. Reboot the server to ensure all changes take effect"
echo "2. Verify no OpenVPN services are running: systemctl list-units | grep openvpn"
echo "3. Check that failed service errors are gone: systemctl --failed"
echo ""
log_warning "Note: The openvpn@client.service failure should now be resolved"
echo ""
echo "Removal completed at: $(date)"
