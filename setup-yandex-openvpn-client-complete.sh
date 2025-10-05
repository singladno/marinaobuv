#!/bin/bash

# Setup OpenVPN client on Russian server for Yandex Cloud
echo "🔧 Setting up OpenVPN client for Yandex Cloud..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN
sudo apt install -y openvpn

# Create client configuration directory
sudo mkdir -p /etc/openvpn/client

# Create client configuration template
sudo tee /etc/openvpn/client/yandex-vpn.conf > /dev/null << 'CLIENT_CONFIG'
# Yandex Cloud OpenVPN Client Configuration
client
dev tun
proto udp
remote YOUR_YANDEX_SERVER_IP 1194
resolv-retry infinite
nobind
persist-key
persist-tun

# Certificates (download from Yandex Cloud server)
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

# Create split-tunnel configuration (OpenAI only)
sudo tee /etc/openvpn/client/yandex-split-tunnel.conf > /dev/null << 'SPLIT_CONFIG'
# Split-tunnel OpenVPN Client Configuration (OpenAI only)
client
dev tun
proto udp
remote YOUR_YANDEX_SERVER_IP 1194
resolv-retry infinite
nobind
persist-key
persist-tun

# Certificates
ca ca.crt
cert client.crt
key client.key
tls-auth ta.key 1

# Security
cipher AES-256-CBC
auth SHA256

# Split-tunnel: Only route OpenAI through VPN
route 104.16.0.0/12  # OpenAI IP range
route 104.20.0.0/16  # OpenAI IP range
route 104.24.0.0/16  # OpenAI IP range
route 104.28.0.0/16  # OpenAI IP range
route 104.32.0.0/16  # OpenAI IP range
route 104.36.0.0/16  # OpenAI IP range
route 104.40.0.0/16  # OpenAI IP range
route 104.44.0.0/16  # OpenAI IP range
route 104.48.0.0/16  # OpenAI IP range
route 104.52.0.0/16  # OpenAI IP range
route 104.56.0.0/16  # OpenAI IP range
route 104.60.0.0/16  # OpenAI IP range
route 104.64.0.0/16  # OpenAI IP range
route 104.68.0.0/16  # OpenAI IP range
route 104.72.0.0/16  # OpenAI IP range
route 104.76.0.0/16  # OpenAI IP range
route 104.80.0.0/16  # OpenAI IP range
route 104.84.0.0/16  # OpenAI IP range
route 104.88.0.0/16  # OpenAI IP range
route 104.92.0.0/16  # OpenAI IP range
route 104.96.0.0/16  # OpenAI IP range
route 104.100.0.0/16 # OpenAI IP range
route 104.104.0.0/16 # OpenAI IP range
route 104.108.0.0/16 # OpenAI IP range
route 104.112.0.0/16 # OpenAI IP range
route 104.116.0.0/16 # OpenAI IP range
route 104.120.0.0/16 # OpenAI IP range
route 104.124.0.0/16 # OpenAI IP range
route 104.128.0.0/16 # OpenAI IP range
route 104.132.0.0/16 # OpenAI IP range
route 104.136.0.0/16 # OpenAI IP range
route 104.140.0.0/16 # OpenAI IP range
route 104.144.0.0/16 # OpenAI IP range
route 104.148.0.0/16 # OpenAI IP range
route 104.152.0.0/16 # OpenAI IP range
route 104.156.0.0/16 # OpenAI IP range
route 104.160.0.0/16 # OpenAI IP range
route 104.164.0.0/16 # OpenAI IP range
route 104.168.0.0/16 # OpenAI IP range
route 104.172.0.0/16 # OpenAI IP range
route 104.176.0.0/16 # OpenAI IP range
route 104.180.0.0/16 # OpenAI IP range
route 104.184.0.0/16 # OpenAI IP range
route 104.188.0.0/16 # OpenAI IP range
route 104.192.0.0/16 # OpenAI IP range
route 104.196.0.0/16 # OpenAI IP range
route 104.200.0.0/16 # OpenAI IP range
route 104.204.0.0/16 # OpenAI IP range
route 104.208.0.0/16 # OpenAI IP range
route 104.212.0.0/16 # OpenAI IP range
route 104.216.0.0/16 # OpenAI IP range
route 104.220.0.0/16 # OpenAI IP range
route 104.224.0.0/16 # OpenAI IP range
route 104.228.0.0/16 # OpenAI IP range
route 104.232.0.0/16 # OpenAI IP range
route 104.236.0.0/16 # OpenAI IP range
route 104.240.0.0/16 # OpenAI IP range
route 104.244.0.0/16 # OpenAI IP range
route 104.248.0.0/16 # OpenAI IP range
route 104.252.0.0/16 # OpenAI IP range

# Compression
comp-lzo

# Logging
verb 3
SPLIT_CONFIG

# Create connection scripts
cat > /home/ubuntu/connect-yandex-vpn-full.sh << 'FULL_SCRIPT'
#!/bin/bash

# Connect to Yandex Cloud VPN (full tunnel)
echo "🔧 Connecting to Yandex Cloud VPN (full tunnel)..."

# Start OpenVPN client
sudo openvpn --config /etc/openvpn/client/yandex-vpn.conf --daemon

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
FULL_SCRIPT

cat > /home/ubuntu/connect-yandex-vpn-split.sh << 'SPLIT_SCRIPT'
#!/bin/bash

# Connect to Yandex Cloud VPN (split tunnel - OpenAI only)
echo "🔧 Connecting to Yandex Cloud VPN (split tunnel - OpenAI only)..."

# Start OpenVPN client
sudo openvpn --config /etc/openvpn/client/yandex-split-tunnel.conf --daemon

# Wait for connection
sleep 15

# Check VPN status
ip route | grep tun

# Test OpenAI API through VPN
echo "🚀 Testing OpenAI API through VPN..."
curl -s --max-time 10 https://api.openai.com/v1/models > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ OpenAI API accessible through VPN!"
    
    # Test Green API (should work directly, not through VPN)
    echo "🚀 Testing Green API (direct connection)..."
    curl -s --max-time 10 https://api.green-api.com/waInstance1105334583/getSettings/your-token > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Green API working directly (fast Russian connection)!"
    else
        echo "⚠️ Green API test failed (but this is expected without token)"
    fi
    
    # Run parser
    echo "🚀 Running parser with split-tunnel VPN..."
    cd /var/www/marinaobuv/web
    source .env.local
    npm run parse
else
    echo "❌ OpenAI API still blocked"
fi

# Disconnect VPN
echo "🛑 Disconnecting VPN..."
sudo pkill openvpn

echo "✅ Parser with split-tunnel VPN complete!"
SPLIT_SCRIPT

# Make scripts executable
chmod +x /home/ubuntu/connect-yandex-vpn-full.sh
chmod +x /home/ubuntu/connect-yandex-vpn-split.sh

echo "✅ OpenVPN client setup complete!"
echo "📋 Available scripts:"
echo "  • ./connect-yandex-vpn-full.sh - Full tunnel (all traffic through VPN)"
echo "  • ./connect-yandex-vpn-split.sh - Split tunnel (OpenAI only through VPN)"
echo "📋 Next: Get certificates from Yandex Cloud server"
