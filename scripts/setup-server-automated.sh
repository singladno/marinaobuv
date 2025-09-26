#!/bin/bash

# Automated Server Setup Script for MarinaObuv
# Run this script on your Yandex Cloud VPS

set -e

echo "🚀 Starting automated server setup for MarinaObuv..."

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

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Step 2: Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git vim htop unzip software-properties-common
print_success "Essential packages installed"

# Step 3: Install Docker
print_status "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh
print_success "Docker installed successfully"

# Step 4: Install Docker Compose
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
print_success "Docker Compose installed successfully"

# Step 5: Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
print_success "Node.js 20 installed successfully"

# Step 6: Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y
print_success "Nginx installed successfully"

# Step 7: Install Certbot for SSL
print_status "Installing Certbot for SSL..."
sudo apt install certbot python3-certbot-nginx -y
print_success "Certbot installed successfully"

# Step 8: Install WireGuard for VPN
print_status "Installing WireGuard for VPN..."
sudo apt install wireguard -y
print_success "WireGuard installed successfully"

# Step 9: Create project directories
print_status "Creating project directories..."
sudo mkdir -p /var/www/marinaobuv
sudo chown $USER:$USER /var/www/marinaobuv
sudo mkdir -p /var/www/marinaobuv/ssl
sudo chown $USER:$USER /var/www/marinaobuv/ssl
mkdir -p /var/www/marinaobuv/backups
print_success "Project directories created"

# Step 10: Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
print_success "Firewall configured"

# Step 11: Enable services
print_status "Enabling services..."
sudo systemctl enable docker
sudo systemctl enable nginx
sudo systemctl start docker
sudo systemctl start nginx
print_success "Services enabled and started"

# Step 12: Create systemd service for WireGuard
print_status "Creating WireGuard service..."
sudo tee /etc/systemd/system/wireguard.service > /dev/null <<EOF
[Unit]
Description=WireGuard VPN
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/wg-quick up wg0
ExecStop=/usr/bin/wg-quick down wg0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable wireguard
print_success "WireGuard service created"

# Step 13: Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/backup-marinaobuv.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/marinaobuv/backups"
mkdir -p \$BACKUP_DIR

# Backup database
if [ -f "/var/www/marinaobuv/docker-compose.prod.yml" ]; then
    docker-compose -f /var/www/marinaobuv/docker-compose.prod.yml exec -T db pg_dump -U marinaobuv_user marinaobuv > \$BACKUP_DIR/db_\$DATE.sql
fi

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz /var/www/marinaobuv

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-marinaobuv.sh
print_success "Backup script created"

# Step 14: Setup cron job for backups
print_status "Setting up backup cron job..."
echo "0 2 * * * /usr/local/bin/backup-marinaobuv.sh" | sudo crontab -
print_success "Backup cron job setup"

# Step 15: Display system information
print_status "Displaying system information..."
echo "=== System Information ==="
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "CPU: $(nproc) cores"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $2}')"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "Nginx: $(nginx -v 2>&1)"

# Step 16: Final status
print_success "🎉 Server setup completed successfully!"
echo ""
echo "=== Next Steps ==="
echo "1. Clone your repository: git clone <your-repo> /var/www/marinaobuv"
echo "2. Configure environment variables"
echo "3. Deploy your application"
echo "4. Setup SSL certificate"
echo "5. Configure VPN for OpenAI access"
echo ""
echo "=== Useful Commands ==="
echo "• Check Docker status: sudo systemctl status docker"
echo "• Check Nginx status: sudo systemctl status nginx"
echo "• View logs: sudo journalctl -u nginx -f"
echo "• Check firewall: sudo ufw status"
echo "• View system resources: htop"
echo ""
print_success "Setup completed! Your server is ready for deployment."
