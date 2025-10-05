#!/bin/bash

# Complete VPN Setup for OpenAI Access
# This script sets up a VPN tunnel through a VPS in a supported region

echo "🚀 Setting up complete VPN solution for OpenAI access..."

# Check if we have a VPS IP
if [ -z "$VPS_IP" ]; then
    echo "❌ Please set VPS_IP environment variable"
    echo "   Example: export VPS_IP=your-vps-ip-here"
    echo ""
    echo "💡 Get a VPS from:"
    echo "   - Hetzner: €3.29/month (Germany)"
    echo "   - Vultr: $3.50/month (Netherlands)"
    echo "   - DigitalOcean: $4/month (Amsterdam)"
    exit 1
fi

# Generate new keys for this setup
echo "🔑 Generating WireGuard keys..."
cd /tmp
wg genkey | tee vpn_server_private_key | wg pubkey > vpn_server_public_key
wg genkey | tee vpn_client_private_key | wg pubkey > vpn_client_public_key

echo "📋 Keys generated:"
echo "Server Private: $(cat vpn_server_private_key)"
echo "Server Public: $(cat vpn_server_public_key)"
echo "Client Private: $(cat vpn_client_private_key)"
echo "Client Public: $(cat vpn_client_public_key)"

# Create server config for VPS
echo "📝 Creating server config for VPS..."
cat > vps_server.conf << EOF
[Interface]
PrivateKey = $(cat vpn_server_private_key)
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $(cat vpn_client_public_key)
AllowedIPs = 10.0.0.2/32
EOF

# Create client config for local machine
echo "📝 Creating client config for local machine..."
cat > local_client.conf << EOF
[Interface]
PrivateKey = $(cat vpn_client_private_key)
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = $(cat vpn_server_public_key)
Endpoint = $VPS_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

# Create deployment script for VPS
echo "📝 Creating VPS deployment script..."
cat > deploy-to-vps.sh << 'EOF'
#!/bin/bash

# Deploy WireGuard server to VPS
echo "🚀 Deploying WireGuard server to VPS..."

# Update system
apt update && apt upgrade -y

# Install WireGuard
apt install -y wireguard

# Create config directory
mkdir -p /etc/wireguard

# Copy server config
cp vps_server.conf /etc/wireguard/wg0.conf

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Show status
wg show

echo "✅ WireGuard server deployed on VPS!"
EOF

# Create local setup script
echo "📝 Creating local setup script..."
cat > setup-local-vpn.sh << 'EOF'
#!/bin/bash

# Setup WireGuard client on local machine
echo "🔧 Setting up WireGuard client locally..."

# Install WireGuard (if not installed)
if ! command -v wg &> /dev/null; then
    echo "📦 Installing WireGuard..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install wireguard-tools
    elif command -v apt &> /dev/null; then
        apt update && apt install -y wireguard
    else
        echo "❌ Unsupported OS. Please install WireGuard manually."
        exit 1
    fi
fi

# Create config directory
sudo mkdir -p /etc/wireguard

# Copy client config
sudo cp local_client.conf /etc/wireguard/wg0.conf

# Start WireGuard
sudo wg-quick up wg0

# Test connection
ping -c 3 10.0.0.1

# Show status
sudo wg show

echo "✅ WireGuard client setup complete!"
EOF

# Create test script
echo "📝 Creating test script..."
cat > test-vpn-openai.sh << 'EOF'
#!/bin/bash

# Test OpenAI API through VPN
echo "🧪 Testing OpenAI API through VPN..."

# Test connection
ping -c 3 10.0.0.1

if [ $? -eq 0 ]; then
    echo "✅ VPN connection working!"
    
    # Test OpenAI API
    cd /Users/dali/Desktop/marinaobuv/web
    source .env.local
    node test-openai.mjs
    
    if [ $? -eq 0 ]; then
        echo "✅ OpenAI API accessible through VPN!"
    else
        echo "❌ OpenAI API still blocked"
    fi
else
    echo "❌ VPN connection failed"
fi
EOF

# Make scripts executable
chmod +x deploy-to-vps.sh setup-local-vpn.sh test-vpn-openai.sh

echo "✅ VPN setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to VPS:"
echo "   scp vps_server.conf deploy-to-vps.sh root@$VPS_IP:/tmp/"
echo "   ssh root@$VPS_IP 'cd /tmp && chmod +x deploy-to-vps.sh && ./deploy-to-vps.sh'"
echo ""
echo "2. Setup local client:"
echo "   ./setup-local-vpn.sh"
echo ""
echo "3. Test VPN:"
echo "   ./test-vpn-openai.sh"
echo ""
echo "4. Deploy to your Russian server:"
echo "   scp local_client.conf setup-local-vpn.sh root@your-russian-server:/tmp/"
echo "   ssh root@your-russian-server 'cd /tmp && chmod +x setup-local-vpn.sh && ./setup-local-vpn.sh'"
