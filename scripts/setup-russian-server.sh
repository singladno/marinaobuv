#!/bin/bash

# Russian Server Setup Script for MarinaObuv
# Run this script on your Yandex Cloud VPS

set -e

echo "🚀 Setting up Russian server for MarinaObuv..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
sudo apt install -y curl wget git vim htop unzip software-properties-common

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt install certbot python3-certbot-nginx -y

# Install WireGuard for VPN
echo "🔐 Installing WireGuard..."
sudo apt install wireguard -y

# Create project directory
echo "📁 Creating project directory..."
sudo mkdir -p /var/www/marinaobuv
sudo chown $USER:$USER /var/www/marinaobuv

# Create SSL directory
echo "🔒 Creating SSL directory..."
sudo mkdir -p /var/www/marinaobuv/ssl
sudo chown $USER:$USER /var/www/marinaobuv/ssl

# Create backups directory
echo "💾 Creating backups directory..."
mkdir -p /var/www/marinaobuv/backups

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create systemd service for WireGuard
echo "🔐 Creating WireGuard service..."
sudo tee /etc/systemd/system/wireguard.service > /dev/null <<EOF
[Unit]
Description=WireGuard VPN
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/wg-quick up wg0
ExecStop=/usr/bin/wg-quick down wg0

[Install]
WantedBy=multi-user.target
EOF

# Enable services
echo "🔄 Enabling services..."
sudo systemctl enable docker
sudo systemctl enable nginx
sudo systemctl enable wireguard

# Start services
echo "🚀 Starting services..."
sudo systemctl start docker
sudo systemctl start nginx

echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure WireGuard VPN: sudo nano /etc/wireguard/wg0.conf"
echo "2. Clone your repository: git clone <your-repo> /var/www/marinaobuv"
echo "3. Setup environment variables"
echo "4. Configure SSL certificate"
echo "5. Start your application"
