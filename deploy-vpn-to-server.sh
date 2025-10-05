#!/bin/bash

# Deploy VPN setup to Russian server
echo "🚀 Deploying VPN setup to Russian server..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

echo "📡 Server: $SERVER_USER@$SERVER_IP"
echo "🔑 SSH Key: $SSH_KEY"

# Create server setup script
cat > server-vpn-setup.sh << 'EOF'
#!/bin/bash

# VPN setup for Russian server
echo "🔧 Setting up VPN on Russian server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install NordVPN
echo "📦 Installing NordVPN..."
wget https://repo.nordvpn.com/deb/nordvpn/debian/pool/main/nordvpn-release_1.0.0_all.deb
sudo dpkg -i nordvpn-release_1.0.0_all.deb
sudo apt update
sudo apt install -y nordvpn

# Create VPN connection script
cat > /home/ubuntu/connect-vpn-and-parse.sh << 'VPN_EOF'
#!/bin/bash

# Connect to VPN and run parser
echo "🔧 Connecting to VPN..."
nordvpn connect us

# Wait for connection
sleep 15

# Check VPN status
nordvpn status

# Run parser
echo "🚀 Running parser with VPN..."
cd /var/www/marinaobuv/web
source .env.local
npm run parse

# Disconnect VPN
echo "🛑 Disconnecting VPN..."
nordvpn disconnect
VPN_EOF

# Make script executable
chmod +x /home/ubuntu/connect-vpn-and-parse.sh

# Create systemd service for auto-connect
sudo tee /etc/systemd/system/marinaobuv-vpn.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=MarinaObuv VPN Parser
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/var/www/marinaobuv/web
ExecStart=/home/ubuntu/connect-vpn-and-parse.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable marinaobuv-vpn.service

echo "✅ VPN setup complete on server!"
echo "📋 Next steps:"
echo "1. Login to NordVPN: nordvpn login"
echo "2. Test connection: nordvpn connect us"
echo "3. Test parser: ./connect-vpn-and-parse.sh"
echo "4. Schedule with cron: crontab -e"
EOF

# Deploy to server
echo "📤 Deploying to server..."
scp -i $SSH_KEY server-vpn-setup.sh $SERVER_USER@$SERVER_IP:/tmp/

echo "🚀 Running setup on server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'cd /tmp && chmod +x server-vpn-setup.sh && ./server-vpn-setup.sh'

echo "✅ VPN deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to server: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "2. Login to NordVPN: nordvpn login"
echo "3. Test connection: nordvpn connect us"
echo "4. Test parser: ./connect-vpn-and-parse.sh"
echo "5. Schedule with cron: crontab -e"
