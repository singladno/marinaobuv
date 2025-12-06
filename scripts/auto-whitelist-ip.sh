#!/bin/bash

# Auto-Whitelist IP Script for Fail2Ban
# This script automatically whitelists your current IP in Fail2Ban
# Run this via GitHub Actions or cron to keep your IP whitelisted

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

# Get current IP (from multiple sources for reliability)
get_current_ip() {
    # Try multiple services
    IP1=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "")
    IP2=$(curl -s --max-time 5 icanhazip.com 2>/dev/null || echo "")
    IP3=$(curl -s --max-time 5 ipinfo.io/ip 2>/dev/null || echo "")

    # Use first successful result
    if [ -n "$IP1" ] && [[ $IP1 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "$IP1"
    elif [ -n "$IP2" ] && [[ $IP2 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "$IP2"
    elif [ -n "$IP3" ] && [[ $IP3 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "$IP3"
    else
        log_error "Could not determine current IP address"
        exit 1
    fi
}

# Check if IP is already whitelisted
is_ip_whitelisted() {
    local ip=$1
    if grep -q "$ip" /etc/fail2ban/jail.local 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Add IP to whitelist
whitelist_ip() {
    local ip=$1
    local jail_file="/etc/fail2ban/jail.local"

    log_info "Adding IP $ip to Fail2Ban whitelist..."

    # Backup config
    sudo cp "$jail_file" "${jail_file}.backup.$(date +%Y%m%d_%H%M%S)"

    # Check if [DEFAULT] section exists
    if ! grep -q "^\[DEFAULT\]" "$jail_file"; then
        log_error "[DEFAULT] section not found in $jail_file"
        exit 1
    fi

    # Remove old IPs from whitelist (optional - comment out if you want to keep all IPs)
    # This removes IPs that match the pattern but aren't localhost
    # sudo sed -i '/^ignoreip = /s/ [0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+//g' "$jail_file"

    # Check if ignoreip line exists
    if grep -q "^ignoreip = " "$jail_file"; then
        # Update existing ignoreip line
        if ! grep -q "$ip" "$jail_file"; then
            sudo sed -i "/^ignoreip = /s/$/ $ip/" "$jail_file"
            log_success "Added $ip to existing ignoreip line"
        else
            log_info "IP $ip already in ignoreip line"
        fi
    else
        # Add new ignoreip line after [DEFAULT]
        sudo sed -i "/^\[DEFAULT\]/a ignoreip = 127.0.0.1/8 ::1 $ip" "$jail_file"
        log_success "Created new ignoreip line with $ip"
    fi

    # Also unban the IP if it's currently banned
    if sudo fail2ban-client status sshd 2>/dev/null | grep -q "$ip"; then
        log_info "Unbanning IP $ip..."
        sudo fail2ban-client set sshd unbanip "$ip" 2>/dev/null || true
    fi

    # Restart Fail2Ban
    sudo systemctl restart fail2ban

    log_success "IP $ip whitelisted and Fail2Ban restarted"
}

# Main execution
main() {
    echo "=========================================="
    echo "Auto-Whitelist IP for Fail2Ban"
    echo "=========================================="
    echo ""

    # Get current IP
    CURRENT_IP=$(get_current_ip)
    log_info "Current IP: $CURRENT_IP"

    # Check if already whitelisted
    if is_ip_whitelisted "$CURRENT_IP"; then
        log_success "IP $CURRENT_IP is already whitelisted"

        # Still unban if banned
        if sudo fail2ban-client status sshd 2>/dev/null | grep -q "$CURRENT_IP"; then
            log_info "Unbanning IP $CURRENT_IP..."
            sudo fail2ban-client set sshd unbanip "$CURRENT_IP" 2>/dev/null || true
            log_success "IP unbanned"
        fi
    else
        # Whitelist the IP
        whitelist_ip "$CURRENT_IP"
    fi

    echo ""
    log_info "Current Fail2Ban status:"
    sudo fail2ban-client status sshd | head -10
    echo ""
    log_success "✅ Done! Your IP is now whitelisted."
}

# Run main function
main
