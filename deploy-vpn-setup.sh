#!/bin/bash

# Complete VPN Setup and Deployment Script
# This script sets up VPN for OpenAI access on your Russian server

echo "🚀 Starting VPN deployment for OpenAI access..."

# Check if we're on the server or local
if [ -f "/var/www/marinaobuv/package.json" ]; then
    echo "📡 Running on server - setting up VPN client"
    SERVER_MODE=true
else
    echo "💻 Running locally - preparing deployment"
    SERVER_MODE=false
fi

# Function to install WireGuard
install_wireguard() {
    echo "📦 Installing WireGuard..."
    if command -v apt &> /dev/null; then
        apt update && apt install -y wireguard
    elif command -v yum &> /dev/null; then
        yum install -y epel-release && yum install -y wireguard-tools
    elif command -v brew &> /dev/null; then
        brew install wireguard-tools
    else
        echo "❌ Unsupported package manager"
        exit 1
    fi
}

# Function to generate WireGuard keys
generate_keys() {
    echo "🔑 Generating WireGuard keys..."
    cd /tmp
    wg genkey | tee server_private_key | wg pubkey > server_public_key
    wg genkey | tee client_private_key | wg pubkey > client_public_key
    
    echo "📋 Keys generated:"
    echo "Server Private: $(cat server_private_key)"
    echo "Server Public: $(cat server_public_key)"
    echo "Client Private: $(cat client_private_key)"
    echo "Client Public: $(cat client_public_key)"
    
    # Save keys to files
    cp server_private_key ~/server_private_key
    cp server_public_key ~/server_public_key
    cp client_private_key ~/client_private_key
    cp client_public_key ~/client_public_key
}

# Function to create server config
create_server_config() {
    echo "📝 Creating server configuration..."
    cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = $(cat ~/server_private_key)
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $(cat ~/client_public_key)
AllowedIPs = 10.0.0.2/32
EOF
}

# Function to create client config
create_client_config() {
    echo "📝 Creating client configuration..."
    cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = $(cat ~/client_private_key)
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = $(cat ~/server_public_key)
Endpoint = $VPN_SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF
}

# Function to start WireGuard
start_wireguard() {
    echo "🚀 Starting WireGuard..."
    systemctl enable wg-quick@wg0
    systemctl start wg-quick@wg0
    
    # Wait for connection
    sleep 3
    
    # Test connection
    echo "🧪 Testing VPN connection..."
    ping -c 3 10.0.0.1
    
    # Show status
    echo "📊 WireGuard status:"
    wg show
}

# Function to test OpenAI access
test_openai() {
    echo "🧪 Testing OpenAI API access..."
    
    # Create test script
    cat > /tmp/test-openai.js << 'EOF'
const https = require('https');

const testOpenAI = async () => {
  console.log('🧪 Testing OpenAI API through VPN...');
  
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ OpenAI API accessible through VPN!');
        const models = JSON.parse(data);
        console.log(`📊 Available models: ${models.data.length}`);
      } else {
        console.log('❌ OpenAI API error:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
  });

  req.end();
};

if (!process.env.OPENAI_API_KEY) {
  console.log('❌ Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

testOpenAI();
EOF

    # Run test
    node /tmp/test-openai.js
}

# Main execution
if [ "$SERVER_MODE" = true ]; then
    echo "🔧 Setting up VPN client on server..."
    install_wireguard
    generate_keys
    create_client_config
    start_wireguard
    test_openai
else
    echo "💻 Preparing deployment files..."
    install_wireguard
    generate_keys
    echo "📋 Copy these keys to your server deployment:"
    echo "Server Public Key: $(cat ~/server_public_key)"
    echo "Client Private Key: $(cat ~/client_private_key)"
    echo "Client Public Key: $(cat ~/client_public_key)"
fi

echo "✅ VPN setup complete!"
