#!/bin/bash

# Deploy Surfshark to Russian server for OpenAI access
echo "🚀 Deploying Surfshark to Russian server..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

echo "📡 Server: $SERVER_USER@$SERVER_IP"
echo "🔑 SSH Key: $SSH_KEY"

# Create server setup script
cat > server-surfshark-setup.sh << 'EOF'
#!/bin/bash

# Surfshark setup for Russian server
echo "🔧 Setting up Surfshark on Russian server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y wget curl

# Download Surfshark CLI
echo "📦 Downloading Surfshark CLI..."
wget https://ocean.surfshark.com/debian/pool/main/s/surfshark/surfshark_1.0.0_amd64.deb

# Install Surfshark
sudo dpkg -i surfshark_1.0.0_amd64.deb
sudo apt-get install -f

# Create VPN connection script
cat > /home/ubuntu/connect-surfshark-and-parse.sh << 'VPN_EOF'
#!/bin/bash

# Connect to Surfshark and run parser
echo "🔧 Connecting to Surfshark VPN..."

# Login to Surfshark (you'll need to enter credentials)
echo "📝 Please login to Surfshark:"
surfshark login

# Connect to US server
echo "🌐 Connecting to US server..."
surfshark connect us

# Wait for connection
sleep 15

# Check VPN status
surfshark status

# Run parser
echo "🚀 Running parser with VPN..."
cd /var/www/marinaobuv/web
source .env.local
npm run parse

# Disconnect VPN
echo "🛑 Disconnecting VPN..."
surfshark disconnect

echo "✅ Parser with VPN complete!"
VPN_EOF

# Make script executable
chmod +x /home/ubuntu/connect-surfshark-and-parse.sh

# Create systemd service for auto-connect
sudo tee /etc/systemd/system/marinaobuv-surfshark.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=MarinaObuv Surfshark Parser
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/var/www/marinaobuv/web
ExecStart=/home/ubuntu/connect-surfshark-and-parse.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable marinaobuv-surfshark.service

echo "✅ Surfshark setup complete on server!"
echo "📋 Next steps:"
echo "1. Login to Surfshark: surfshark login"
echo "2. Test connection: surfshark connect us"
echo "3. Test parser: ./connect-surfshark-and-parse.sh"
echo "4. Schedule with cron: crontab -e"
EOF

# Deploy to server
echo "📤 Deploying to server..."
scp -i $SSH_KEY server-surfshark-setup.sh $SERVER_USER@$SERVER_IP:/tmp/

echo "🚀 Running setup on server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'cd /tmp && chmod +x server-surfshark-setup.sh && ./server-surfshark-setup.sh'

echo "✅ Surfshark deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to server: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "2. Login to Surfshark: surfshark login"
echo "3. Test connection: surfshark connect us"
echo "4. Test parser: ./connect-surfshark-and-parse.sh"
echo "5. Schedule with cron: crontab -e"
