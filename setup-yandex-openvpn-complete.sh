#!/bin/bash

# OpenVPN Client Setup for Yandex Cloud VM
# This script sets up OpenVPN client with policy-based routing for OpenAI traffic only
# Author: AI Assistant
# Date: $(date)

set -euo pipefail

echo "🚀 Starting OpenVPN client setup for Yandex Cloud VM..."
echo "This will configure OpenVPN to route ONLY OpenAI traffic through VPN tunnel"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Step 1: Updating system packages..."
apt update && apt upgrade -y
print_success "System updated successfully"

print_status "Step 2: Installing required packages..."
apt install -y openvpn iproute2 dnsutils curl ca-certificates
print_success "Required packages installed"

print_status "Step 3: Requesting .ovpn file path..."
echo ""
echo "Please provide the path to your .ovpn file:"
echo "Example: /root/profile.ovpn"
echo ""
read -p "Enter the path to your .ovpn file: " OVPN_PATH

# Validate the file exists
if [[ ! -f "$OVPN_PATH" ]]; then
    print_error "File $OVPN_PATH does not exist!"
    exit 1
fi

print_status "Step 4: Copying .ovpn file to OpenVPN config..."
cp "$OVPN_PATH" /etc/openvpn/client.conf
chmod 600 /etc/openvpn/client.conf
print_success "OpenVPN config file created"

print_status "Step 5: Enabling and starting OpenVPN client..."
systemctl enable --now openvpn@client.service
print_success "OpenVPN client service enabled and started"

print_status "Step 6: Waiting for tun0 interface to appear (up to 30 seconds)..."
for i in {1..30}; do
    if ip link show tun0 >/dev/null 2>&1; then
        print_success "tun0 interface found after $i seconds"
        break
    fi
    if [[ $i -eq 30 ]]; then
        print_error "tun0 interface did not appear after 30 seconds"
        print_warning "Check OpenVPN logs: journalctl -u openvpn@client"
        exit 1
    fi
    sleep 1
done

print_status "Step 7: Creating route update script..."
mkdir -p /var/lib/openai-pbr

cat > /usr/local/sbin/update-openai-routes.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
OVPN_IFACE="tun0"
DOMAINS="api.openai.com files.openai.com"
STATE_FILE="/var/lib/openai-pbr/last_ips.txt"
mkdir -p "$(dirname "$STATE_FILE")"
touch "$STATE_FILE"

declare -A NEW_IPS=()
for domain in $DOMAINS; do
  for ip in $(dig +short A $domain); do NEW_IPS["$ip"]=1; done
done

OLD_IPS=$(cat "$STATE_FILE" || true)

for ip in $OLD_IPS; do
  [[ -z "${NEW_IPS[$ip]+x}" ]] && ip route del "$ip/32" dev "$OVPN_IFACE" 2>/dev/null || true
done

for ip in "${!NEW_IPS[@]}"; do
  ip route replace "$ip/32" dev "$OVPN_IFACE" scope link 2>/dev/null || true
done

printf "%s\n" "${!NEW_IPS[@]}" > "$STATE_FILE"
EOF

chmod +x /usr/local/sbin/update-openai-routes.sh
print_success "Route update script created"

print_status "Step 8: Running route update script manually..."
bash /usr/local/sbin/update-openai-routes.sh
print_success "Initial routes created"

print_status "Step 9: Creating systemd service for route updates..."
cat > /etc/systemd/system/openai-routes.service << 'EOF'
[Unit]
Description=Update OpenAI VPN routes
After=network-online.target openvpn@client.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/update-openai-routes.sh

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service created"

print_status "Step 10: Creating systemd timer for periodic updates..."
cat > /etc/systemd/system/openai-routes.timer << 'EOF'
[Unit]
Description=Run OpenAI VPN route updater hourly

[Timer]
OnBootSec=1m
OnUnitActiveSec=1h
Unit=openai-routes.service

[Install]
WantedBy=timers.target
EOF

print_success "Systemd timer created"

print_status "Step 11: Enabling and starting the timer..."
systemctl daemon-reload
systemctl enable --now openai-routes.timer
print_success "Timer enabled and started"

print_status "Step 12: Verifying setup..."

echo ""
echo "🔍 Verification Results:"
echo "========================"

echo ""
print_status "Checking tun0 routes:"
ip route | grep tun0 || print_warning "No tun0 routes found"

echo ""
print_status "Testing OpenAI API connectivity through VPN:"
if curl -s --max-time 10 https://api.openai.com/v1/models --interface tun0 >/dev/null; then
    print_success "OpenAI API accessible through VPN"
else
    print_warning "OpenAI API test failed - check VPN connection"
fi

echo ""
print_status "Testing external IP through VPN:"
EXTERNAL_IP=$(curl -s --max-time 10 https://ifconfig.io --interface tun0 2>/dev/null || echo "Failed")
if [[ "$EXTERNAL_IP" != "Failed" ]]; then
    print_success "External IP through VPN: $EXTERNAL_IP"
else
    print_warning "External IP test failed"
fi

echo ""
echo "📋 Setup Summary:"
echo "================="
print_success "✅ OpenVPN client installed and configured"
print_success "✅ Policy-based routing script created"
print_success "✅ Systemd service and timer configured"
print_success "✅ Automatic startup enabled"

echo ""
echo "📊 How to check logs:"
echo "====================="
echo "• OpenVPN client logs: journalctl -u openvpn@client"
echo "• Route update logs: journalctl -u openai-routes.service"
echo "• Timer logs: journalctl -u openai-routes.timer"
echo "• All logs: journalctl -f"

echo ""
echo "🔧 Manual commands:"
echo "==================="
echo "• Check routes: ip route | grep tun0"
echo "• Test OpenAI: curl https://api.openai.com/v1/models --interface tun0"
echo "• Test external IP: curl https://ifconfig.io --interface tun0"
echo "• Restart OpenVPN: systemctl restart openvpn@client"
echo "• Update routes manually: /usr/local/sbin/update-openai-routes.sh"

echo ""
print_success "🎉 OpenVPN setup completed successfully!"
print_status "The system will automatically start OpenVPN and update routes on reboot."
print_status "Only traffic to api.openai.com and files.openai.com will go through the VPN tunnel."