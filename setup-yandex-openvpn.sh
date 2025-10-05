#!/bin/bash

# Yandex Cloud OpenVPN Setup for Russian Server
echo "🚀 Setting up Yandex Cloud OpenVPN for Russian server..."

# Create OpenVPN server configuration
cat > openvpn-server.conf << 'EOF'
# OpenVPN Server Configuration for Yandex Cloud
port 1194
proto udp
dev tun

# Certificates
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem

# Network settings
server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt

# Routes
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Security
cipher AES-256-CBC
auth SHA256
tls-auth ta.key 0

# Logging
verb 3
explicit-exit-notify 1

# Keep alive
keepalive 10 120

# Compression
comp-lzo

# User authentication
plugin /usr/lib/x86_64-linux-gnu/openvpn/plugins/openvpn-plugin-auth-pam.so login
EOF

# Create client configuration
cat > openvpn-client.conf << 'EOF'
# OpenVPN Client Configuration
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

# Compression
comp-lzo

# Logging
verb 3
EOF

# Create setup script for Yandex Cloud
cat > setup-yandex-openvpn.sh << 'EOF'
#!/bin/bash

# Setup OpenVPN on Yandex Cloud VM
echo "🔧 Setting up OpenVPN on Yandex Cloud VM..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN and EasyRSA
sudo apt install -y openvpn easy-rsa

# Create CA directory
make-cadir ~/openvpn-ca
cd ~/openvpn-ca

# Configure EasyRSA
source vars
./clean-all
./build-ca --batch
./build-key-server --batch server
./build-dh
./build-key --batch client1

# Create tls-auth key
openvpn --genkey --secret keys/ta.key

# Copy certificates
sudo cp keys/ca.crt /etc/openvpn/
sudo cp keys/server.crt /etc/openvpn/
sudo cp keys/server.key /etc/openvpn/
sudo cp keys/dh2048.pem /etc/openvpn/
sudo cp keys/ta.key /etc/openvpn/

# Copy server config
sudo cp openvpn-server.conf /etc/openvpn/server.conf

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure iptables
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
sudo iptables -A INPUT -i tun+ -j ACCEPT
sudo iptables -A FORWARD -i tun+ -j ACCEPT
sudo iptables -A FORWARD -i tun+ -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o tun+ -m state --state RELATED,ESTABLISHED -j ACCEPT

# Save iptables rules
sudo iptables-save > /etc/iptables/rules.v4

# Start OpenVPN
sudo systemctl start openvpn@server
sudo systemctl enable openvpn@server

echo "✅ OpenVPN server setup complete!"
echo "📋 Server IP: $(curl -s ifconfig.me)"
echo "📋 Client config created: client1.ovpn"
EOF

# Create client setup script for Russian server
cat > setup-russian-client.sh << 'EOF'
#!/bin/bash

# Setup OpenVPN client on Russian server
echo "🔧 Setting up OpenVPN client on Russian server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN
sudo apt install -y openvpn

# Create OpenVPN directory
sudo mkdir -p /etc/openvpn/client

# Copy client certificates and config
sudo cp ca.crt /etc/openvpn/client/
sudo cp client1.crt /etc/openvpn/client/
sudo cp client1.key /etc/openvpn/client/
sudo cp ta.key /etc/openvpn/client/
sudo cp openvpn-client.conf /etc/openvpn/client/

# Create systemd service
sudo tee /etc/systemd/system/openvpn-client.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=OpenVPN Client
After=network.target

[Service]
Type=notify
ExecStart=/usr/sbin/openvpn --config /etc/openvpn/client/openvpn-client.conf
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Create VPN connection script
cat > /home/ubuntu/connect-vpn-and-parse.sh << 'VPN_EOF'
#!/bin/bash

# Connect to OpenVPN and run parser
echo "🔧 Connecting to OpenVPN..."

# Start OpenVPN client
sudo systemctl start openvpn-client
sudo systemctl enable openvpn-client

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
sudo systemctl stop openvpn-client

echo "✅ Parser with VPN complete!"
VPN_EOF

# Make script executable
chmod +x /home/ubuntu/connect-vpn-and-parse.sh

echo "✅ OpenVPN client setup complete!"
EOF

# Create deployment instructions
cat > DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# Yandex Cloud OpenVPN Deployment Instructions

## Step 1: Create Yandex Cloud VM

1. Go to Yandex Cloud Console
2. Create a new VM instance
3. Choose Ubuntu 20.04 LTS
4. Select region: Netherlands or Germany
5. Minimum specs: 1 vCPU, 2GB RAM
6. Enable public IP

## Step 2: Setup OpenVPN Server

1. SSH to your Yandex Cloud VM
2. Upload setup script: `scp setup-yandex-openvpn.sh root@YOUR_YANDEX_IP:/tmp/`
3. Run setup: `ssh root@YOUR_YANDEX_IP 'cd /tmp && chmod +x setup-yandex-openvpn.sh && ./setup-yandex-openvpn.sh'`

## Step 3: Deploy to Russian Server

1. Copy client files to Russian server
2. Run client setup: `./setup-russian-client.sh`
3. Test connection: `./connect-vpn-and-parse.sh`

## Step 4: Configure Firewall

On Yandex Cloud VM:
```bash
# Allow OpenVPN traffic
sudo ufw allow 1194/udp
sudo ufw enable
```

## Step 5: Test OpenAI Access

```bash
# Test OpenAI API through VPN
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

## Cost: ~$5-10/month for Yandex Cloud VM
EOF

echo "✅ Yandex Cloud OpenVPN solution ready!"
echo ""
echo "📋 Next steps:"
echo "1. Create Yandex Cloud VM in Netherlands/Germany"
echo "2. Run setup-yandex-openvpn.sh on VM"
echo "3. Deploy to Russian server"
echo "4. Test OpenAI access"
echo ""
echo "💰 Cost: ~$5-10/month (much cheaper than VPN services)"
echo "✅ Works in Russia (Yandex Cloud is Russian company)"
