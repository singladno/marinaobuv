#!/bin/bash

# MarinaObuv PM2 Deployment Script
# This script deploys the Next.js app using PM2 and systemd (no Docker)

set -e

echo "🚀 Deploying MarinaObuv with PM2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="marinaobuv"
APP_DIR="/var/www/marinaobuv"
WEB_DIR="/var/www/marinaobuv/web"
USER="www-data"
NODE_VERSION="20"

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Setting up PM2 deployment for MarinaObuv..."

# 1. Install Node.js 20 if not present
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check Node.js version
NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_CURRENT" -lt "20" ]; then
    print_warning "Node.js version is $NODE_CURRENT, but 20+ is recommended"
fi

# 2. Install PM2 globally
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# 3. Install PostgreSQL if not present
print_status "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 4. Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER marinaobuv_user WITH PASSWORD 'marinaobuv_password';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE marinaobuv OWNER marinaobuv_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE marinaobuv TO marinaobuv_user;" 2>/dev/null || true

# 5. Install Nginx if not present
print_status "Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# 6. Create application directory
print_status "Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 7. Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# 7.1. Set execute permissions for scripts
print_status "Setting execute permissions for scripts..."
chmod +x scripts/*.sh
chmod +x web/src/scripts/*.sh 2>/dev/null || true

# 8. Install dependencies
print_status "Installing dependencies..."
npm install
cd $WEB_DIR
# Install all dependencies (including dev dependencies needed for Prisma generation)
npm install
cd ..

# 9. Sync migration files to ensure all files are present
print_status "Syncing migration files..."
if [ -f "scripts/sync-migration-files.sh" ]; then
    chmod +x scripts/sync-migration-files.sh
    if ./scripts/sync-migration-files.sh; then
        print_success "Migration files synced successfully"
    else
        print_warning "Migration sync failed, but continuing with deployment..."
    fi
else
    print_warning "Migration sync script not found, skipping sync..."
fi

# 10. Generate Prisma client
print_status "Generating Prisma client..."
cd $WEB_DIR
npm run prisma:generate
cd ..

# 10. Run database migrations with conflict resolution
print_status "Running database migrations with conflict resolution..."
cd $WEB_DIR
# Use production environment for migrations
if [ -f ".env.production" ]; then
    if ./prisma-server.sh npx prisma migrate deploy; then
        print_success "Database migrations completed successfully"
    else
        print_warning "Database migrations failed, attempting conflict resolution..."
        if [ -f "../scripts/fix-migration-conflicts.sh" ]; then
            chmod +x ../scripts/fix-migration-conflicts.sh
            if ../scripts/fix-migration-conflicts.sh; then
                print_success "Migration conflicts resolved successfully"
            else
                print_warning "Migration conflict resolution failed, attempting schema fix..."
                if ../scripts/fix-database-schema.sh; then
                    print_success "Database schema fixed successfully"
                else
                    print_error "Database schema fix failed!"
                    exit 1
                fi
            fi
        else
            print_warning "Migration conflict resolution script not found, attempting schema fix..."
            if ../scripts/fix-database-schema.sh; then
                print_success "Database schema fixed successfully"
            else
                print_error "Database schema fix failed!"
                exit 1
            fi
        fi
    fi
else
    print_warning ".env.production not found, using local environment"
else
    print_warning ".env.production not found, using local environment"
    # Load environment variables safely
    set -a  # automatically export all variables
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        # Export the variable (this handles quotes correctly)
        export "$line"
    done < .env.local
    set +a  # turn off automatic export
    npm run prisma:migrate
fi
fi
cd ..

# 11. Build the application
print_status "Building the application..."
cd $WEB_DIR
npm run build
cd ..

# 12. Use existing ecosystem.config.js
print_status "Using existing PM2 configuration..."
# The ecosystem.config.js file is already in the project root

# 13. Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# 14. Start or reload PM2 with ecosystem (main application only)
print_status "Starting or reloading PM2 with ecosystem..."
pm2 startOrReload $APP_DIR/ecosystem.config.js --env production --update-env

# 14.1. Verify main application is running
print_status "Verifying main application is running..."
sleep 5
if pm2 list | grep -q "marinaobuv.*online"; then
    print_success "Main application (marinaobuv) is running"
else
    print_error "Main application (marinaobuv) is not running"
    exit 1
fi

# 15. Save PM2 configuration and ensure startup
pm2 save
pm2 startup

# 16. Fix and Configure Nginx
print_status "Fixing and configuring Nginx..."
if [ -f "scripts/fix-nginx-config.sh" ]; then
    chmod +x scripts/fix-nginx-config.sh
    if ./scripts/fix-nginx-config.sh; then
        print_success "Nginx configuration fixed successfully"
    else
        print_error "Failed to fix nginx configuration - deployment cannot continue"
        exit 1
    fi
else
    print_warning "Nginx fix script not found, using manual configuration..."
    sudo tee /etc/nginx/sites-available/marinaobuv << EOF
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files with caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF
fi

# 17. Enable the site
sudo ln -sf /etc/nginx/sites-available/marinaobuv /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 18. Test and reload Nginx
print_status "Testing Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

# 19. Setup SSL with Let's Encrypt
print_status "Setting up SSL certificate..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# 20. Create systemd service for PM2
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/pm2-$APP_NAME.service << EOF
[Unit]
Description=PM2 process manager for $APP_NAME
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
ExecStart=/usr/local/bin/pm2 start $APP_DIR/ecosystem.config.js --env production
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

# 21. Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable pm2-$APP_NAME
sudo systemctl start pm2-$APP_NAME

# 22. Remove unused Docker containers and setup firewall
print_status "Removing unused Docker containers..."
# Remove tinyproxy container (not used by application)
docker stop tinyproxy 2>/dev/null || true
docker rm tinyproxy 2>/dev/null || true
print_success "Tinyproxy container removed (was not used by application)"

print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Note: Groq proxy runs on separate serverspace server
sudo ufw --force enable

# 23. Create deployment script
print_status "Creating deployment script..."
cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash
# Quick deployment script for updates

set -e

echo "🚀 Deploying MarinaObuv update..."

# Pull latest changes
git pull origin main

# Sync migration files
if [ -f "scripts/sync-migration-files.sh" ]; then
    chmod +x scripts/sync-migration-files.sh
    ./scripts/sync-migration-files.sh
fi

# Install dependencies
cd /var/www/marinaobuv/web
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
if [ -f ".env.production" ]; then
    ./prisma-server.sh npx prisma migrate deploy
else
    print_warning ".env.production not found, using local environment"
else
    print_warning ".env.production not found, using local environment"
    # Load environment variables safely
    set -a  # automatically export all variables
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        # Export the variable (this handles quotes correctly)
        export "$line"
    done < .env.local
    set +a  # turn off automatic export
    npm run prisma:migrate
fi
fi

# Build application
npm run build

# Setup parsing cron job
if [ -f "web/src/scripts/deploy-cron.sh" ]; then
    cd web && ./src/scripts/deploy-cron.sh
fi

# Restart PM2
pm2 restart marinaobuv

echo "✅ Deployment complete!"
EOF

chmod +x $APP_DIR/deploy.sh

# 24. Create monitoring script
print_status "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash
# Monitoring script for MarinaObuv

echo "📊 MarinaObuv Status:"
echo "===================="

echo "PM2 Status:"
pm2 status

echo ""
echo "Main Application Logs (last 20 lines):"
pm2 logs marinaobuv --lines 20

echo ""
echo "Note: Groq Proxy Server runs on separate serverspace server (31.44.2.216)"

echo ""
echo "System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "Database Status:"
sudo -u postgres psql -c "SELECT 1;" 2>/dev/null && echo "✅ PostgreSQL is running" || echo "❌ PostgreSQL is not running"

echo ""
echo "Nginx Status:"
sudo systemctl is-active nginx && echo "✅ Nginx is running" || echo "❌ Nginx is not running"

echo ""
echo "Application Health:"
curl -s http://localhost:3000/api/health && echo "✅ Main application is healthy" || echo "❌ Main application is not responding"

echo ""
echo "Note: Groq Proxy Server Health check skipped (runs on separate server)"

echo ""
echo "WhatsApp Webhook Status:"
curl -s https://marina-obuv.ru/api/webhooks/green-api && echo "✅ Webhook endpoint is accessible" || echo "❌ Webhook endpoint is not accessible"
EOF

chmod +x $APP_DIR/monitor.sh

# 25. Setup parsing cron job
print_status "Setting up parsing cron job..."
cd $WEB_DIR
if [ -f "src/scripts/deploy-cron.sh" ]; then
    ./src/scripts/deploy-cron.sh
    print_success "Parsing cron job configured"
else
    print_warning "Parsing cron script not found, skipping cron setup"
fi

# 26. Install/update all cron jobs (including batch polling and proxy monitoring)
print_status "Installing/updating all cron jobs..."
cd $APP_DIR
if [ -f "scripts/install-crons.sh" ]; then
    bash scripts/install-crons.sh
    print_success "All cron jobs installed (parsing, queue polling, batch polling, backup, proxy monitoring)"
else
    print_warning "Cron installation script not found"
fi

# 26.1. Proxy server runs on separate serverspace server (31.44.2.216)
print_status "Note: Groq proxy server runs on separate serverspace server"
print_status "Proxy deployment is handled by GitHub Actions workflow"

cd $APP_DIR

# 26. Verify webhook script exists and is executable
print_status "Verifying webhook deployment script..."
if [ -f "scripts/verify-webhook-deployment.sh" ]; then
    if [ -x "scripts/verify-webhook-deployment.sh" ]; then
        print_success "Webhook verification script is ready"
    else
        print_warning "Webhook script exists but not executable, fixing..."
        chmod +x scripts/verify-webhook-deployment.sh
        print_success "Webhook script permissions fixed"
    fi
else
    print_error "Webhook verification script not found!"
    exit 1
fi

# 27. Final status check
print_status "Performing final status check..."

# Check PM2 status for main application
if pm2 list | grep -q "marinaobuv.*online"; then
    print_success "PM2 main application is running"
else
    print_error "PM2 main application is not running"
    pm2 logs marinaobuv --lines 10
fi

# Note: Proxy server runs on separate serverspace server
print_status "Note: Groq proxy server runs on separate serverspace server (31.44.2.216)"
print_status "Proxy connectivity will be tested via nginx configuration"

# Check Nginx status
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

# Check database
if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "PostgreSQL is running"
else
    print_error "PostgreSQL is not running"
fi

# 28. Configure webhook after deployment
print_status "Configuring Green API webhook..."
cd $WEB_DIR
if [ -f ".env" ] && [ -n "$(grep GREEN_API_INSTANCE_ID .env)" ]; then
    print_status "Setting up webhook configuration"
    export $(grep -v '^#' .env | xargs)
    if npx tsx src/scripts/configure-webhook.ts; then
        print_success "Webhook configured successfully"
    else
        print_warning "Webhook configuration failed, but deployment completed"
    fi
else
    print_warning "No Green API credentials found, skipping webhook setup"
fi
cd $APP_DIR

# 29. Run webhook verification
print_status "Running webhook verification..."
if ./scripts/verify-webhook-deployment.sh; then
    print_success "Webhook verification passed!"
else
    print_warning "Webhook verification failed, but deployment completed"
    print_status "You may need to manually check the webhook endpoint"
fi

print_success "🎉 MarinaObuv deployment completed!"
print_status "Your application should now be running at:"
print_status "http://$(curl -s ifconfig.me)"
print_status ""
print_status "Useful commands:"
print_status "  Monitor: $APP_DIR/monitor.sh"
print_status "  Deploy updates: $APP_DIR/deploy.sh"
print_status "  PM2 logs: pm2 logs marinaobuv"
print_status "  PM2 status: pm2 status"
print_status "  Restart app: pm2 restart marinaobuv"
print_status "  Note: Proxy runs on separate serverspace server"
print_status "  Test webhook: ./scripts/verify-webhook-deployment.sh"
print_status "  Check proxy: ./scripts/check-proxy-health.sh"
print_status "  Verify deployment: ./scripts/verify-deployment.sh"
print_status ""
print_status "Next steps:"
print_status "1. Configure your domain DNS to point to this server"
print_status "2. Run: sudo certbot --nginx -d your-domain.com"
print_status "3. Setup SMS integration: ./scripts/setup-sms-env.sh"
print_status "4. Update your environment variables in $WEB_DIR/.env.production"
print_status "5. Test SMS login functionality"
