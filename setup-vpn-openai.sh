#!/bin/bash

# VPN Setup Script for OpenAI Access
# This script sets up WireGuard VPN on your server

echo "🔧 Setting up VPN for OpenAI access..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install WireGuard
sudo apt install wireguard -y

# Generate server keys
cd /etc/wireguard
sudo wg genkey | sudo tee server_private_key | wg pubkey | sudo tee server_public_key

# Generate client keys
sudo wg genkey | sudo tee client_private_key | wg pubkey | sudo tee client_public_key

# Create WireGuard config
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
PrivateKey = $(sudo cat server_private_key)
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $(sudo cat client_public_key)
AllowedIPs = 10.0.0.2/32
EOF

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Start WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

echo "✅ WireGuard server configured!"
echo "📋 Server Public Key: $(sudo cat server_public_key)"
echo "📋 Client Private Key: $(sudo cat client_private_key)"
echo "📋 Client Public Key: $(sudo cat client_public_key)"
echo ""
echo "🔧 Next steps:"
echo "1. Configure your Russian server as WireGuard client"
echo "2. Route OpenAI traffic through VPN"
echo "3. Test OpenAI API access"
