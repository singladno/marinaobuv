#!/bin/bash

# Setup split-tunnel OpenVPN for OpenAI only
echo "🔧 Setting up split-tunnel OpenVPN (OpenAI only)..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

# Create split-tunnel OpenVPN client configuration
cat > setup-split-tunnel-client.sh << 'EOF'
#!/bin/bash

# Setup split-tunnel OpenVPN client (OpenAI only)
echo "🔧 Setting up split-tunnel OpenVPN client..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN
sudo apt install -y openvpn

# Create split-tunnel client configuration
sudo tee /etc/openvpn/client.conf > /dev/null << 'SPLIT_CONFIG'
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

# Create split-tunnel connection script
cat > /home/ubuntu/connect-split-tunnel-and-parse.sh << 'SPLIT_SCRIPT'
#!/bin/bash

# Connect to split-tunnel VPN and run parser
echo "🔧 Connecting to split-tunnel VPN (OpenAI only)..."

# Start OpenVPN client
sudo openvpn --config /etc/openvpn/client.conf --daemon

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

# Make script executable
chmod +x /home/ubuntu/connect-split-tunnel-and-parse.sh

echo "✅ Split-tunnel OpenVPN client setup complete!"
echo "📋 Benefits:"
echo "  • OpenAI requests → VPN (bypasses restrictions)"
echo "  • Green API requests → Direct Russian connection (fast)"
echo "  • All other traffic → Direct Russian connection (fast)"
echo "📋 Usage: ./connect-split-tunnel-and-parse.sh"
EOF

# Create deployment script
cat > deploy-split-tunnel.sh << 'EOF'
#!/bin/bash

# Deploy split-tunnel OpenVPN solution
echo "🚀 Deploying split-tunnel OpenVPN solution..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

# Deploy client setup to Russian server
echo "📤 Deploying split-tunnel client setup to Russian server..."
scp -i $SSH_KEY setup-split-tunnel-client.sh $SERVER_USER@$SERVER_IP:/tmp/

# Run client setup on Russian server
echo "🔧 Setting up split-tunnel OpenVPN client on Russian server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd /tmp && chmod +x setup-split-tunnel-client.sh && ./setup-split-tunnel-client.sh"

echo "✅ Split-tunnel OpenVPN solution deployed!"
echo ""
echo "📋 Benefits:"
echo "  • OpenAI requests → VPN (bypasses restrictions)"
echo "  • Green API requests → Direct Russian connection (fast)"
echo "  • All other traffic → Direct Russian connection (fast)"
echo ""
echo "📋 Next steps:"
echo "1. Create Yandex Cloud VM in Netherlands/Germany"
echo "2. Setup OpenVPN server on Yandex Cloud VM"
echo "3. Get certificates and update client configuration"
echo "4. Test: ./connect-split-tunnel-and-parse.sh"
echo ""
echo "💰 Cost: ~$5-10/month for Yandex Cloud VM"
echo "✅ Fast Russian server + OpenAI access"
EOF

# Make scripts executable
chmod +x setup-split-tunnel-client.sh deploy-split-tunnel.sh

echo "✅ Split-tunnel OpenVPN solution ready!"
echo ""
echo "🎯 Benefits:"
echo "  • OpenAI requests → VPN (bypasses restrictions)"
echo "  • Green API requests → Direct Russian connection (fast)"
echo "  • All other traffic → Direct Russian connection (fast)"
echo ""
echo "🚀 Next: Run ./deploy-split-tunnel.sh to deploy to your server"
