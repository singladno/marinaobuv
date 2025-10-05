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
