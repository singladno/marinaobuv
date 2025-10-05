#!/bin/bash

# Setup Paid VPN for OpenAI Access
echo "🚀 Setting up paid VPN for OpenAI access..."

echo "💰 Best Paid VPN Options for OpenAI:"
echo ""
echo "1️⃣ NordVPN - $3.99/month"
echo "   - 60+ countries, fast servers"
echo "   - Dedicated IP option"
echo "   - 30-day money-back guarantee"
echo "   - Website: https://nordvpn.com"
echo ""
echo "2️⃣ ExpressVPN - $12.95/month"
echo "   - 94+ countries, fastest speeds"
echo "   - Best for streaming and APIs"
echo "   - 30-day money-back guarantee"
echo "   - Website: https://expressvpn.com"
echo ""
echo "3️⃣ Surfshark - $2.49/month"
echo "   - 100+ countries, unlimited devices"
echo "   - Good for multiple servers"
echo "   - 30-day money-back guarantee"
echo "   - Website: https://surfshark.com"
echo ""
echo "4️⃣ CyberGhost - $2.75/month"
echo "   - 91+ countries, user-friendly"
echo "   - Good for beginners"
echo "   - 45-day money-back guarantee"
echo "   - Website: https://cyberghostvpn.com"
echo ""

# Create setup instructions
cat > vpn-setup-instructions.md << 'EOF'
# VPN Setup Instructions for OpenAI Access

## Step 1: Choose and Sign Up for VPN

### Recommended: NordVPN ($3.99/month)
1. Go to https://nordvpn.com
2. Click "Get NordVPN"
3. Choose "Complete" plan ($3.99/month)
4. Create account and pay
5. Download NordVPN app

### Alternative: ExpressVPN ($12.95/month)
1. Go to https://expressvpn.com
2. Click "Get ExpressVPN"
3. Choose 1-year plan ($12.95/month)
4. Create account and pay
5. Download ExpressVPN app

## Step 2: Install VPN App

### macOS:
```bash
# NordVPN
brew install --cask nordvpn

# ExpressVPN
brew install --cask expressvpn
```

### Linux (for server):
```bash
# NordVPN
wget https://repo.nordvpn.com/deb/nordvpn/debian/pool/main/nordvpn-release_1.0.0_all.deb
sudo dpkg -i nordvpn-release_1.0.0_all.deb
sudo apt update
sudo apt install nordvpn

# ExpressVPN
wget https://www.expressvpn.works/clients/linux/expressvpn_3.21.0.8-1_amd64.deb
sudo dpkg -i expressvpn_3.21.0.8-1_amd64.deb
```

## Step 3: Configure VPN

### NordVPN:
```bash
# Login
nordvpn login

# Connect to US server
nordvpn connect us

# Check status
nordvpn status

# Disconnect
nordvpn disconnect
```

### ExpressVPN:
```bash
# Login
expressvpn activate

# Connect to US server
expressvpn connect us

# Check status
expressvpn status

# Disconnect
expressvpn disconnect
```

## Step 4: Test OpenAI API

```bash
# Test OpenAI API
cd /Users/dali/Desktop/marinaobuv/web
source .env.local
node test-openai.mjs
```

## Step 5: Configure for Server Deployment

### For Russian Server:
1. Install VPN on server
2. Connect to US/Europe server
3. Run parser with VPN enabled
4. Set up auto-connect on boot

### Auto-connect script:
```bash
#!/bin/bash
# Connect to VPN and run parser
nordvpn connect us
sleep 10
cd /var/www/marinaobuv/web
source .env.local
npm run parse
nordvpn disconnect
```
EOF

echo "📝 Created setup instructions: vpn-setup-instructions.md"
echo ""
echo "🚀 Quick Start:"
echo "1. Choose a VPN service (recommended: NordVPN)"
echo "2. Sign up and download the app"
echo "3. Install and connect to US server"
echo "4. Test OpenAI API"
echo "5. Deploy to your Russian server"
echo ""
echo "✅ Setup instructions ready!"
