#!/bin/bash

# Setup VPN on existing Russian server
echo "🚀 Setting up VPN on your existing Russian server..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

echo "📡 Using existing server: $SERVER_USER@$SERVER_IP"

# Create OpenVPN client setup for existing server
cat > setup-existing-server-vpn.sh << 'EOF'
#!/bin/bash

# Setup OpenVPN client on existing Russian server
echo "🔧 Setting up OpenVPN client on existing server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenVPN
sudo apt install -y openvpn

# Create OpenVPN directory
sudo mkdir -p /etc/openvpn/client

# Create client configuration
sudo tee /etc/openvpn/client/client.conf > /dev/null << 'CLIENT_EOF'
# OpenVPN Client Configuration
client
dev tun
proto udp
remote YOUR_VPN_SERVER_IP 1194
resolv-retry infinite
nobind
persist-key
persist-tun

# Certificates (you'll need to get these from VPN provider)
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
CLIENT_EOF

# Create VPN connection script
cat > /home/ubuntu/connect-vpn-and-parse.sh << 'VPN_EOF'
#!/bin/bash

# Connect to VPN and run parser
echo "🔧 Connecting to VPN..."

# Start OpenVPN client
sudo openvpn --config /etc/openvpn/client/client.conf --daemon

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
sudo pkill openvpn

echo "✅ Parser with VPN complete!"
VPN_EOF

# Make script executable
chmod +x /home/ubuntu/connect-vpn-and-parse.sh

echo "✅ OpenVPN client setup complete!"
echo "📋 Next: Get VPN server details and certificates"
EOF

# Create free VPN options
cat > FREE_VPN_OPTIONS.md << 'EOF'
# Free VPN Options for Your Russian Server

## Option 1: Free OpenVPN Servers
- **VPN Gate**: https://www.vpngate.net/
- **Free OpenVPN**: https://www.freeopenvpn.org/
- **VPNBook**: https://www.vpnbook.com/freevpn

## Option 2: Cheap VPN Services
- **ProtonVPN Free**: https://protonvpn.com/free-vpn
- **Windscribe Free**: https://windscribe.com/free
- **TunnelBear Free**: https://www.tunnelbear.com/

## Option 3: Use Your Own VPS
- **Hetzner**: €3.29/month (Germany)
- **Vultr**: $3.50/month (Netherlands)
- **DigitalOcean**: $4/month (Amsterdam)

## Option 4: Use Proxy Instead
- **Free Proxy Lists**: https://www.proxy-list.download/
- **ProxyScrape**: https://proxyscrape.com/
- **FreeProxyList**: https://free-proxy-list.net/
EOF

# Create proxy-based solution
cat > setup-proxy-for-openai.sh << 'EOF'
#!/bin/bash

# Setup proxy for OpenAI access (no VPN needed)
echo "🔧 Setting up proxy for OpenAI access..."

# Install proxy tools
sudo apt install -y proxychains4

# Create proxy configuration
sudo tee /etc/proxychains4.conf > /dev/null << 'PROXY_EOF'
# ProxyChains config
strict_chain
proxy_dns
remote_dns_subnet 224
tcp_read_time_out 15000
tcp_connect_time_out 8000

# Free proxy servers (update with working ones)
[ProxyList]
http 127.0.0.1 8080
http 127.0.0.1 3128
PROXY_EOF

# Create OpenAI proxy script
cat > /home/ubuntu/run-parser-with-proxy.sh << 'PROXY_SCRIPT'
#!/bin/bash

# Run parser with proxy for OpenAI
echo "🔧 Running parser with proxy for OpenAI..."

# Set proxy for OpenAI requests only
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080

# Run parser
cd /var/www/marinaobuv/web
source .env.local
npm run parse

echo "✅ Parser with proxy complete!"
PROXY_SCRIPT

# Make script executable
chmod +x /home/ubuntu/run-parser-with-proxy.sh

echo "✅ Proxy setup complete!"
EOF

# Create deployment script
cat > deploy-to-existing-server.sh << 'EOF'
#!/bin/bash

# Deploy VPN/proxy solution to existing Russian server
echo "🚀 Deploying to existing Russian server..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

# Deploy setup script
scp -i $SSH_KEY setup-existing-server-vpn.sh $SERVER_USER@$SERVER_IP:/tmp/
scp -i $SSH_KEY setup-proxy-for-openai.sh $SERVER_USER@$SERVER_IP:/tmp/

# Run setup on server
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'cd /tmp && chmod +x setup-existing-server-vpn.sh setup-proxy-for-openai.sh'

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. SSH to server: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "2. Choose solution: ./setup-existing-server-vpn.sh OR ./setup-proxy-for-openai.sh"
echo "3. Test OpenAI access"
EOF

# Make scripts executable
chmod +x setup-existing-server-vpn.sh setup-proxy-for-openai.sh deploy-to-existing-server.sh

echo "✅ Solutions ready for your existing server!"
echo ""
echo "📋 Available options:"
echo "1. OpenVPN client (connects to free VPN servers)"
echo "2. Proxy solution (uses free proxy servers)"
echo "3. Deploy to existing server: ./deploy-to-existing-server.sh"
echo ""
echo "💰 Cost: FREE (using free VPN/proxy servers)"
echo "✅ Works with your existing server"
