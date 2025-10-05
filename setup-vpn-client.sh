#!/bin/bash

# WireGuard Client Setup for Russian Server
# This script configures your Russian server as a WireGuard client

echo "🔧 Setting up WireGuard client on Russian server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install WireGuard
sudo apt install wireguard -y

# Get server details from user
echo "Enter your VPS server details:"
read -p "VPS Server IP: " SERVER_IP
read -p "VPS Server Public Key: " SERVER_PUBLIC_KEY
read -p "Client Private Key: " CLIENT_PRIVATE_KEY
read -p "Client Public Key: " CLIENT_PUBLIC_KEY

# Create client config
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
PrivateKey = $CLIENT_PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = $SERVER_PUBLIC_KEY
Endpoint = $SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

# Start WireGuard client
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

echo "✅ WireGuard client configured!"
echo "🌐 Testing connection..."
ping -c 3 10.0.0.1

echo ""
echo "🔧 Next steps:"
echo "1. Test OpenAI API access"
echo "2. Configure your application to use VPN"
echo "3. Set up routing for OpenAI requests"
