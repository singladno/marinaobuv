#!/bin/bash

# Script to setup proxy server with Docker and tinyproxy
# Usage: ./setup-proxy-server.sh PROXY_HOST PROXY_USER PROXY_PASS

set -e

# Check if parameters are provided
if [ $# -ne 3 ]; then
    echo "Usage: $0 PROXY_HOST PROXY_USER PROXY_PASS"
    echo "Example: $0 1.2.3.4 proxyuser proxypass-strong"
    exit 1
fi

PROXY_HOST=$1
PROXY_USER=$2
PROXY_PASS=$3

echo "🚀 Setting up proxy server on $PROXY_HOST"
echo "👤 User: $PROXY_USER"
echo "🔐 Password: [HIDDEN]"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Stop and remove existing tinyproxy container if it exists
echo "🧹 Cleaning up existing tinyproxy container..."
sudo docker stop tinyproxy 2>/dev/null || true
sudo docker rm tinyproxy 2>/dev/null || true

# Start tinyproxy with basic auth
echo "🌐 Starting tinyproxy with authentication..."
sudo docker run -d --name tinyproxy --restart=always \
  -e BASIC_AUTH_USER="$PROXY_USER" \
  -e BASIC_AUTH_PASSWORD="$PROXY_PASS" \
  -p 8888:8888 dannydirect/tinyproxy

# Wait for container to start
echo "⏳ Waiting for tinyproxy to start..."
sleep 5

# Check if container is running
if sudo docker ps | grep -q tinyproxy; then
    echo "✅ tinyproxy is running successfully!"
    echo "🌍 Proxy URL: http://$PROXY_USER:$PROXY_PASS@$PROXY_HOST:8888"
    echo "🔧 Test with: curl -x http://$PROXY_USER:$PROXY_PASS@$PROXY_HOST:8888 ifconfig.io/country"
else
    echo "❌ Failed to start tinyproxy"
    echo "📋 Container logs:"
    sudo docker logs tinyproxy
    exit 1
fi

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    sudo ufw allow 8888/tcp
    echo "✅ Firewall rule added for port 8888"
fi

echo ""
echo "🎉 Proxy server setup complete!"
echo "📋 Next steps:"
echo "1. Update your .env.local with the proxy settings"
echo "2. Test the proxy connection"
echo "3. Run your application with proxy support"
