#!/bin/bash

# Setup Yandex Cloud OpenVPN solution for OpenAI access
echo "🚀 Setting up Yandex Cloud OpenVPN solution..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

echo "📡 Using existing server: $SERVER_USER@$SERVER_IP"
echo "🔑 SSH Key: $SSH_KEY"

# Create Yandex Cloud OpenVPN server setup
cat > setup-yandex-openvpn-server.sh << 'EOF'
#!/bin/bash

# Setup OpenVPN server on Yandex Cloud VM
echo "🔧 Setting up OpenVPN server on Yandex Cloud..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN and Easy-RSA
sudo apt install -y openvpn easy-rsa

# Create CA directory
make-cadir ~/openvpn-ca
cd ~/openvpn-ca

# Configure CA
source vars
./clean-all
./build-ca

# Generate server certificate and key
./build-key-server server

# Generate Diffie-Hellman parameters
./build-dh

# Generate TLS-Auth key
openvpn --genkey --secret keys/ta.key

# Create server configuration
sudo tee /etc/openvpn/server.conf > /dev/null << 'SERVER_CONFIG'
# Yandex Cloud OpenVPN Server Configuration
port 1194
proto udp
dev tun

# Certificates
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem
tls-auth ta.key 0

# Network settings
server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt

# Routing
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Security
cipher AES-256-CBC
auth SHA256
user nobody
group nogroup
persist-key
persist-tun

# Logging
status openvpn-status.log
verb 3

# Yandex Cloud specific settings
explicit-exit-notify 1
SERVER_CONFIG

# Copy certificates to OpenVPN directory
sudo cp ~/openvpn-ca/keys/{ca.crt,server.crt,server.key,dh2048.pem,ta.key} /etc/openvpn/

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure firewall
sudo ufw allow 1194/udp
sudo ufw allow OpenSSH
sudo ufw --force enable

# Start OpenVPN service
sudo systemctl start openvpn@server
sudo systemctl enable openvpn@server

echo "✅ OpenVPN server setup complete!"
echo "📋 Server IP: $(curl -s ifconfig.me)"
echo "📋 Port: 1194"
echo "📋 Protocol: UDP"
EOF

# Create client configuration for Russian server
cat > setup-yandex-openvpn-client.sh << 'EOF'
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
EOF

# Create deployment script
cat > deploy-yandex-openvpn.sh << 'EOF'
#!/bin/bash

# Deploy Yandex Cloud OpenVPN solution
echo "🚀 Deploying Yandex Cloud OpenVPN solution..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

# Deploy client setup to Russian server
echo "📤 Deploying client setup to Russian server..."
scp -i $SSH_KEY setup-yandex-openvpn-client.sh $SERVER_USER@$SERVER_IP:/tmp/

# Run client setup on Russian server
echo "🔧 Setting up OpenVPN client on Russian server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd /tmp && chmod +x setup-yandex-openvpn-client.sh && ./setup-yandex-openvpn-client.sh"

echo "✅ Yandex Cloud OpenVPN solution deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Create Yandex Cloud VM in Netherlands/Germany"
echo "2. Run setup-yandex-openvpn-server.sh on Yandex Cloud VM"
echo "3. Get certificates from Yandex Cloud server"
echo "4. Update client configuration with server IP and certificates"
echo "5. Test: ./connect-yandex-vpn-and-parse.sh"
echo ""
echo "💰 Cost: ~$5-10/month for Yandex Cloud VM"
echo "✅ Works in Russia (Yandex Cloud is Russian company)"
EOF

# Make scripts executable
chmod +x setup-yandex-openvpn-server.sh setup-yandex-openvpn-client.sh deploy-yandex-openvpn.sh

echo "✅ Yandex Cloud OpenVPN solution ready!"
echo ""
echo "📋 Available scripts:"
echo "1. setup-yandex-openvpn-server.sh - For Yandex Cloud VM"
echo "2. setup-yandex-openvpn-client.sh - For your Russian server"
echo "3. deploy-yandex-openvpn.sh - Deploy to your Russian server"
echo ""
echo "🚀 Next: Run ./deploy-yandex-openvpn.sh to deploy to your server"
