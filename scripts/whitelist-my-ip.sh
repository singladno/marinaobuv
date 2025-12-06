#!/bin/bash

# Whitelist My IP Script - Run Locally
# This script gets YOUR local IP and sends it to the server to whitelist
# Usage: ./whitelist-my-ip.sh

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get your local public IP
get_my_ip() {
    log_info "Detecting your public IP address..."

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
        log_error "Could not determine your IP address"
        exit 1
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "Whitelist My IP for Fail2Ban"
    echo "=========================================="
    echo ""

    # Get your IP
    MY_IP=$(get_my_ip)
    log_success "Your IP: $MY_IP"
    echo ""

    log_info "To whitelist this IP, run this command via GitHub Actions:"
    echo ""
    echo "Or create a GitHub Actions workflow with:"
    echo ""
    cat << EOF
- name: Whitelist My IP
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: \${{ secrets.SSH_HOST }}
    username: \${{ secrets.SSH_USER }}
    key: \${{ secrets.SSH_PRIVATE_KEY }}
    port: \${{ secrets.SSH_PORT }}
    script: |
      MY_IP="$MY_IP"
      echo "Whitelisting IP: \$MY_IP"

      # Backup config
      sudo cp /etc/fail2ban/jail.local /etc/fail2ban/jail.local.backup.\$(date +%Y%m%d_%H%M%S)

      # Add to whitelist
      if grep -q "^ignoreip = " /etc/fail2ban/jail.local; then
        if ! grep -q "\$MY_IP" /etc/fail2ban/jail.local; then
          sudo sed -i "/^ignoreip = /s/\$/ \$MY_IP/" /etc/fail2ban/jail.local
          echo "✅ Added \$MY_IP to existing ignoreip line"
        else
          echo "✅ IP \$MY_IP already whitelisted"
        fi
      else
        sudo sed -i "/^\[DEFAULT\]/a ignoreip = 127.0.0.1/8 ::1 \$MY_IP" /etc/fail2ban/jail.local
        echo "✅ Created new ignoreip line with \$MY_IP"
      fi

      # Unban if banned
      sudo fail2ban-client set sshd unbanip "\$MY_IP" 2>/dev/null || echo "Not banned"

      # Restart Fail2Ban
      sudo systemctl restart fail2ban

      echo "✅ IP \$MY_IP whitelisted and Fail2Ban restarted"
EOF
    echo ""
    log_info "Or use the GitHub Actions workflow I'll create next..."
}

main
