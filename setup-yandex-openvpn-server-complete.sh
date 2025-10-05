#!/bin/bash

# Complete Yandex Cloud OpenVPN Access Server setup
echo "🔧 Setting up Yandex Cloud OpenVPN Access Server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y wget curl

# Download and install OpenVPN Access Server
wget -O openvpn-as-install.sh https://openvpn.net/downloads/openvpn-as-2.11.0-ubuntu20.amd_64.deb
sudo dpkg -i openvpn-as-install.sh

# Configure OpenVPN Access Server
sudo /usr/local/openvpn_as/scripts/sacli --key "admin_ui.https.port" --value "943" ConfigPut
sudo /usr/local/openvpn_as/scripts/sacli --key "admin_ui.https.port" --value "943" ConfigPut
sudo /usr/local/openvpn_as/scripts/sacli --key "cs.https.port" --value "943" ConfigPut
sudo /usr/local/openvpn_as/scripts/sacli --key "vpn.server.port" --value "1194" ConfigPut
sudo /usr/local/openvpn_as/scripts/sacli --key "vpn.server.protocol" --value "udp" ConfigPut

# Start OpenVPN Access Server
sudo systemctl start openvpnas
sudo systemctl enable openvpnas

# Get admin password
echo "🔑 Getting admin password..."
sudo /usr/local/openvpn_as/scripts/sacli --key "admin_ui.https.port" --value "943" ConfigPut
sudo /usr/local/openvpn_as/scripts/sacli --key "cs.https.port" --value "943" ConfigPut

# Display admin password
echo "📋 Admin password:"
sudo cat /usr/local/openvpn_as/init.log | grep "To login please use the"

echo "✅ OpenVPN Access Server setup complete!"
echo "📋 Admin UI: https://$(curl -s ifconfig.me):943/admin/"
echo "📋 Client UI: https://$(curl -s ifconfig.me):943/"
echo "📋 Username: openvpn"
echo "📋 Password: (see above)"
