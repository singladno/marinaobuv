#!/bin/bash

# Setup OpenVPN client on existing Russian server
echo "🔧 Setting up OpenVPN client on existing server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN
sudo apt install -y openvpn

# Create OpenVPN directory
sudo mkdir -p /etc/openvpn/client

# Create client configuration template
sudo tee /etc/openvpn/client/client.conf > /dev/null << 'CLIENT_EOF'
# OpenVPN Client Configuration
client
dev tun
proto udp
remote YOUR_VPN_SERVER_IP 1194
resolv-retry infinite
nobind
persist-key
persist-tun

# Certificates (you'll need to get these from VPN provider)
ca ca.crt
cert client.crt
key client.key
tls-auth ta.key 1

# Security
cipher AES-256-CBC
auth SHA256

# Compression
comp-lzo

# Logging
verb 3
CLIENT_EOF

# Create VPN connection script
cat > /home/ubuntu/connect-vpn-and-parse.sh << 'VPN_EOF'
#!/bin/bash

# Connect to VPN and run parser
echo "🔧 Connecting to VPN..."

# Start OpenVPN client
sudo openvpn --config /etc/openvpn/client/client.conf --daemon

# Wait for connection
sleep 15

# Check VPN status
ip route | grep tun

# Run parser
echo "🚀 Running parser with VPN..."
cd /var/www/marinaobuv/web
source .env.local
npm run parse

# Disconnect VPN
echo "🛑 Disconnecting VPN..."
sudo pkill openvpn

echo "✅ Parser with VPN complete!"
VPN_EOF

# Make script executable
chmod +x /home/ubuntu/connect-vpn-and-parse.sh

echo "✅ OpenVPN client setup complete!"
echo "📋 Next: Get VPN server details and certificates"
