#!/bin/bash

# Upload .ovpn file and run OpenVPN setup
echo "🚀 OpenVPN Setup with File Upload"
echo "================================="

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

echo ""
echo "📋 Step 1: You need to get your .ovpn file from OpenVPN Access Server"
echo "   - Go to OpenVPN Access Server web interface"
echo "   - Navigate to 'Client Web UI'"
echo "   - Download the 'autologin profile' (.ovpn file)"
echo "   - Save it to your local computer"
echo ""

echo "📤 Step 2: Upload your .ovpn file to the server"
echo "   Command: scp -i $SSH_KEY your-file.ovpn $SERVER_USER@$SERVER_IP:/tmp/"
echo ""

read -p "Enter the path to your local .ovpn file: " LOCAL_OVPN_PATH

if [[ ! -f "$LOCAL_OVPN_PATH" ]]; then
    echo "❌ File $LOCAL_OVPN_PATH does not exist!"
    exit 1
fi

echo "📤 Uploading .ovpn file to server..."
scp -i $SSH_KEY "$LOCAL_OVPN_PATH" $SERVER_USER@$SERVER_IP:/tmp/

echo "🔧 Running OpenVPN setup on server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd /tmp && sudo ./setup-yandex-openvpn-complete.sh"

echo "✅ Setup complete!"
