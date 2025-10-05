#!/bin/bash

# Deploy complete Yandex Cloud OpenVPN solution
echo "🚀 Deploying complete Yandex Cloud OpenVPN solution..."

# Server details
SERVER_IP="158.160.143.162"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa_marinaobuv"

# Deploy client setup to Russian server
echo "📤 Deploying client setup to Russian server..."
scp -i $SSH_KEY setup-yandex-openvpn-client-complete.sh $SERVER_USER@$SERVER_IP:/tmp/

# Run client setup on Russian server
echo "🔧 Setting up OpenVPN client on Russian server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd /tmp && chmod +x setup-yandex-openvpn-client-complete.sh && ./setup-yandex-openvpn-client-complete.sh"

echo "✅ Complete Yandex Cloud OpenVPN solution deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Create Yandex Cloud VM with OpenVPN Access Server"
echo "2. Configure security groups (ports 443, 1194, 943)"
echo "3. Get admin password from VM console"
echo "4. Access admin UI: https://YANDEX_SERVER_IP:943/admin/"
echo "5. Create user and download client profile"
echo "6. Update client configuration with server IP and certificates"
echo "7. Test: ./connect-yandex-vpn-split.sh (recommended)"
echo ""
echo "💰 Cost: ~$5-10/month for Yandex Cloud VM"
echo "✅ Split-tunnel: OpenAI through VPN, Green API direct (fast)"
