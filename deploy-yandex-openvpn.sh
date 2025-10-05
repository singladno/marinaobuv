#!/bin/bash

# Deploy Yandex Cloud OpenVPN solution
echo "🚀 Deploying Yandex Cloud OpenVPN solution..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

# Deploy client setup to Russian server
echo "📤 Deploying client setup to Russian server..."
scp -i $SSH_KEY setup-yandex-openvpn-client.sh $SERVER_USER@$SERVER_IP:/tmp/

# Run client setup on Russian server
echo "🔧 Setting up OpenVPN client on Russian server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd /tmp && chmod +x setup-yandex-openvpn-client.sh && ./setup-yandex-openvpn-client.sh"

echo "✅ Yandex Cloud OpenVPN solution deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Create Yandex Cloud VM in Netherlands/Germany"
echo "2. Run setup-yandex-openvpn-server.sh on Yandex Cloud VM"
echo "3. Get certificates from Yandex Cloud server"
echo "4. Update client configuration with server IP and certificates"
echo "5. Test: ./connect-yandex-vpn-and-parse.sh"
echo ""
echo "💰 Cost: ~$5-10/month for Yandex Cloud VM"
echo "✅ Works in Russia (Yandex Cloud is Russian company)"
