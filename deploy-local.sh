#!/bin/bash

# Local PM2 Deployment Script for MarinaObuv
# This script sets up PM2 for local development and testing

set -e

echo "🚀 Setting up MarinaObuv locally with PM2..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Setting up local PM2 environment..."

# 1. Install PM2 globally if not present
print_status "Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# 2. Install dependencies
print_status "Installing dependencies..."
npm install

# 3. Install web dependencies
print_status "Installing web dependencies..."
cd web
npm install
cd ..

# 4. Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# 5. Create environment file if it doesn't exist
if [ ! -f "web/.env.local" ]; then
    print_status "Creating local environment file..."
    cat > web/.env.local << EOF
# Database (local PostgreSQL or external)
DATABASE_URL="postgresql://postgres:password@localhost:5432/marinaobuv"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"

# S3 Storage
S3_ENDPOINT="https://s3.eu-central-1.wasabisys.com"
S3_BUCKET="marinaobuv"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"

# CDN
CDN_BASE_URL="https://your-cdn-domain.com"
EOF
    print_warning "Please update web/.env.local with your actual values"
fi

# 6. Generate Prisma client
print_status "Generating Prisma client..."
cd web
npm run prisma:generate
cd ..

# 7. Build the application
print_status "Building the application..."
cd web
npm run build
cd ..

# 8. Stop any existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 delete marinaobuv 2>/dev/null || true

# 9. Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js

# 10. Save PM2 configuration
pm2 save

# 11. Create local development scripts
print_status "Creating development scripts..."

# Create start script
cat > start-local.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting MarinaObuv locally..."
pm2 start ecosystem.config.js
pm2 logs marinaobuv
EOF

chmod +x start-local.sh

# Create stop script
cat > stop-local.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping MarinaObuv..."
pm2 stop marinaobuv
EOF

chmod +x stop-local.sh

# Create restart script
cat > restart-local.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting MarinaObuv..."
pm2 restart marinaobuv
pm2 logs marinaobuv
EOF

chmod +x restart-local.sh

# Create monitor script
cat > monitor-local.sh << 'EOF'
#!/bin/bash
echo "📊 MarinaObuv Local Status:"
echo "============================"

echo "PM2 Status:"
pm2 status

echo ""
echo "Application Logs (last 20 lines):"
pm2 logs marinaobuv --lines 20

echo ""
echo "System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h . | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "Application Health:"
curl -s http://localhost:3000/api/health && echo "✅ Application is healthy" || echo "❌ Application is not responding"
EOF

chmod +x monitor-local.sh

# 12. Final status check
print_status "Performing final status check..."

# Check PM2 status
if pm2 list | grep -q "marinaobuv.*online"; then
    print_success "PM2 application is running"
else
    print_error "PM2 application is not running"
    pm2 logs marinaobuv --lines 10
fi

# Check application health
sleep 5
if curl -s http://localhost:3000/api/health > /dev/null; then
    print_success "Application is healthy"
else
    print_warning "Application may still be starting up..."
fi

print_success "🎉 Local PM2 setup completed!"
print_status ""
print_status "Your application is now running at:"
print_status "http://localhost:3000"
print_status ""
print_status "Useful commands:"
print_status "  Start: ./start-local.sh"
print_status "  Stop: ./stop-local.sh"
print_status "  Restart: ./restart-local.sh"
print_status "  Monitor: ./monitor-local.sh"
print_status "  PM2 logs: pm2 logs marinaobuv"
print_status "  PM2 status: pm2 status"
print_status ""
print_status "Next steps:"
print_status "1. Update web/.env.local with your actual values"
print_status "2. Set up your database (PostgreSQL)"
print_status "3. Run database migrations: cd web && npm run prisma:migrate"
print_status "4. Test your application at http://localhost:3000"
