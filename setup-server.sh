#!/bin/bash

# Server setup script for MarinaObuv
# This script sets up the server environment for PM2 deployment

set -e

echo "🚀 Setting up MarinaObuv server environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_status "Setting up server environment for MarinaObuv..."

# 1. Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 if not present
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install PM2 globally
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# 4. Install PostgreSQL if not present
print_status "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 5. Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER marinaobuv_user WITH PASSWORD 'marinaobuv_password';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE marinaobuv OWNER marinaobuv_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE marinaobuv TO marinaobuv_user;" 2>/dev/null || true

# 6. Install Nginx if not present
print_status "Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# 7. Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/marinaobuv
sudo chown -R $USER:$USER /var/www/marinaobuv

# 8. Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 9. Create systemd service for PM2
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/pm2-marinaobuv.service << EOF
[Unit]
Description=PM2 process manager for marinaobuv
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=notify
User=$USER
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/bin:/usr/local/bin
Environment=PM2_HOME=/home/$USER/.pm2
ExecStart=/usr/local/bin/pm2 start /var/www/marinaobuv/ecosystem.config.js --env production
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

# 10. Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable pm2-marinaobuv

# 11. Create log directory
print_status "Creating log directory..."
mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

print_success "🎉 Server setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Clone your repository: git clone https://github.com/singladno/marinaobuv.git /var/www/marinaobuv"
print_status "2. Run the deployment script: cd /var/www/marinaobuv && ./deploy-pm2.sh"
print_status "3. Configure your domain DNS to point to this server"
print_status "4. Set up SSL certificate with Let's Encrypt"
print_status ""
print_status "Your server is now ready for MarinaObuv deployment!"
