#!/bin/bash

# Setup OpenVPN client on Russian server
echo "🔧 Setting up OpenVPN client on Russian server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN
sudo apt install -y openvpn

# Create client configuration
sudo tee /etc/openvpn/client.conf > /dev/null << 'CLIENT_CONFIG'
# Yandex Cloud OpenVPN Client Configuration
client
dev tun
proto udp
remote YOUR_YANDEX_SERVER_IP 1194
resolv-retry infinite
nobind
persist-key
persist-tun

# Certificates (you'll need to get these from Yandex server)
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
CLIENT_CONFIG

# Create VPN connection script
cat > /home/ubuntu/connect-yandex-vpn-and-parse.sh << 'VPN_SCRIPT'
#!/bin/bash

# Connect to Yandex Cloud VPN and run parser
echo "🔧 Connecting to Yandex Cloud VPN..."

# Start OpenVPN client
sudo openvpn --config /etc/openvpn/client.conf --daemon

# Wait for connection
sleep 15

# Check VPN status
ip route | grep tun

# Test OpenAI API
echo "🚀 Testing OpenAI API through VPN..."
curl -s --max-time 10 https://api.openai.com/v1/models > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ OpenAI API accessible through VPN!"
    # Run parser
    echo "🚀 Running parser with VPN..."
    cd /var/www/marinaobuv/web
    source .env.local
    npm run parse
else
    echo "❌ OpenAI API still blocked"
fi

# Disconnect VPN
echo "🛑 Disconnecting VPN..."
sudo pkill openvpn

echo "✅ Parser with Yandex Cloud VPN complete!"
VPN_SCRIPT

# Make script executable
chmod +x /home/ubuntu/connect-yandex-vpn-and-parse.sh

echo "✅ OpenVPN client setup complete!"
echo "📋 Next: Get certificates from Yandex Cloud server"
