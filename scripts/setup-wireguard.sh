#!/bin/bash

# WireGuard VPN Setup for OpenAI Access
# This script configures WireGuard to access OpenAI services

set -e

echo "🔐 Setting up WireGuard VPN for OpenAI access..."

# Generate WireGuard keys
echo "🔑 Generating WireGuard keys..."
cd /etc/wireguard

# Generate private key
wg genkey | tee privatekey | wg pubkey > publickey

# Get keys
PRIVATE_KEY=$(cat privatekey)
PUBLIC_KEY=$(cat publickey)

echo "Generated keys:"
echo "Private key: $PRIVATE_KEY"
echo "Public key: $PUBLIC_KEY"

# Create WireGuard configuration
echo "📝 Creating WireGuard configuration..."
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
PrivateKey = $PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 1.1.1.1, 8.8.8.8

# OpenAI access through VPN
PostUp = iptables -A OUTPUT -d 104.18.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.19.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.20.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.21.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.22.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.23.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.24.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.25.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.26.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.27.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.28.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.29.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.30.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.31.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.32.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.33.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.34.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.35.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.36.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.37.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.38.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.39.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.40.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.41.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.42.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.43.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.44.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.45.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.46.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.47.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.48.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.49.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.50.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.51.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.52.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.53.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.54.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.55.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.56.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.57.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.58.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.59.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.60.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.61.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.62.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.63.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.64.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.65.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.66.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.67.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.68.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.69.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.70.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.71.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.72.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.73.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.74.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.75.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.76.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.77.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.78.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.79.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.80.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.81.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.82.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.83.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.84.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.85.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.86.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.87.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.88.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.89.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.90.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.91.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.92.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.93.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.94.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.95.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.96.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.97.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.98.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.99.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.100.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.101.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.102.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.103.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.104.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.105.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.106.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.107.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.108.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.109.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.110.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.111.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.112.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.113.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.114.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.115.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.116.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.117.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.118.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.119.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.120.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.121.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.122.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.123.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.124.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.125.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.126.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.127.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.128.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.129.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.130.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.131.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.132.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.133.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.134.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.135.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.136.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.137.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.138.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.139.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.140.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.141.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.142.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.143.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.144.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.145.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.146.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.147.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.148.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.149.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.150.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.151.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.152.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.153.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.154.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.155.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.156.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.157.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.158.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.159.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.160.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.161.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.162.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.163.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.164.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.165.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.166.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.167.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.168.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.169.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.170.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.171.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.172.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.173.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.174.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.175.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.176.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.177.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.178.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.179.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.180.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.181.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.182.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.183.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.184.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.185.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.186.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.187.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.188.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.189.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.190.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.191.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.192.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.193.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.194.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.195.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.196.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.197.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.198.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.199.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.200.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.201.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.202.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.203.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.204.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.205.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.206.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.207.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.208.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.209.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.210.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.211.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.212.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.213.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.214.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.215.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.216.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.217.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.218.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.219.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.220.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.221.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.222.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.223.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.224.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.225.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.226.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.227.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.228.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.229.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.230.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.231.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.232.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.233.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.234.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.235.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.236.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.237.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.238.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.239.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.240.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.241.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.242.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.243.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.244.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.245.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.246.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.247.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.248.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.249.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.250.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.251.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.252.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.253.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.254.0.0/16 -j ACCEPT
PostUp = iptables -A OUTPUT -d 104.255.0.0/16 -j ACCEPT

[Peer]
# Add your VPN provider's peer configuration here
# You'll need to get this from your VPN provider
PublicKey = YOUR_VPN_PROVIDER_PUBLIC_KEY
Endpoint = YOUR_VPN_PROVIDER_ENDPOINT
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

# Set proper permissions
sudo chmod 600 /etc/wireguard/wg0.conf
sudo chmod 600 privatekey
sudo chmod 644 publickey

echo "✅ WireGuard configuration created!"
echo ""
echo "Next steps:"
echo "1. Get VPN provider details (PublicKey, Endpoint)"
echo "2. Update /etc/wireguard/wg0.conf with provider details"
echo "3. Start WireGuard: sudo systemctl start wireguard"
echo "4. Enable auto-start: sudo systemctl enable wireguard"
echo ""
echo "Your public key: $PUBLIC_KEY"
echo "Share this with your VPN provider to get the peer configuration."
