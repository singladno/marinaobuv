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
