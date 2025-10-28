#!/bin/bash

# Local Deployment Script
# This script mirrors the server deployment process for local testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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
if [ ! -f "package.json" ] || [ ! -d "web" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "🚀 Starting local deployment process..."

# 1. Environment Setup
print_status "🔧 Setting up environment..."

# Check if .env exists
if [ ! -f "web/.env" ]; then
    print_error ".env file not found! Please create web/.env with your configuration"
    exit 1
fi
print_success "Using existing .env file for local development"

# 2. Install Dependencies
print_status "📦 Installing dependencies..."
npm install
cd web && npm install
cd ..

# 3. Database Setup
print_status "🗄️ Setting up database..."

# Check if PostgreSQL is running and start it if needed
if ! pg_isready -q; then
    print_warning "PostgreSQL is not running. Starting PostgreSQL..."
    
    # Try to start PostgreSQL automatically
    if command -v brew &> /dev/null; then
        print_status "Starting PostgreSQL with Homebrew..."
        brew services start postgresql
        sleep 3
    elif command -v systemctl &> /dev/null; then
        print_status "Starting PostgreSQL with systemctl..."
        sudo systemctl start postgresql
        sleep 3
    else
        print_error "Cannot start PostgreSQL automatically. Please start it manually."
        print_status "On macOS: brew services start postgresql"
        print_status "On Linux: sudo systemctl start postgresql"
        exit 1
    fi
    
    # Check if PostgreSQL started successfully
    if ! pg_isready -q; then
        print_error "Failed to start PostgreSQL automatically. Please start it manually."
        exit 1
    fi
fi

# Create database and user if they don't exist
print_status "🔧 Setting up database and user..."
createdb marinaobuv 2>/dev/null || print_warning "Database 'marinaobuv' may already exist"

# Create the user that the existing .env file expects
psql -d marinaobuv -c "CREATE USER marina_local WITH PASSWORD 'Q6sRk2pVw8yHf3Xb1MzN4qLd';" 2>/dev/null || print_warning "User 'marina_local' may already exist"
psql -d marinaobuv -c "GRANT ALL PRIVILEGES ON DATABASE marinaobuv TO marina_local;" 2>/dev/null || print_warning "Privileges may already be granted"
psql -d marinaobuv -c "ALTER USER marina_local CREATEDB;" 2>/dev/null || print_warning "User may already have CREATEDB privilege"

# Load environment variables safely
load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        print_status "Loading environment variables from $env_file..."
        # Use a safer method that preserves quotes and handles special characters
        set -a  # automatically export all variables
        # Process the .env file line by line, handling quotes properly
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
                continue
            fi
            # Export the variable (this handles quotes correctly)
            export "$line"
        done < "$env_file"
        set +a  # turn off automatic export
    else
        print_error "Environment file not found: $env_file"
        exit 1
    fi
}

# Check database connection
print_status "🔍 Testing database connection..."
cd web
# Use .env file for local development
load_env ".env"
if npx prisma db pull --print > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_warning "Database connection test failed, but continuing..."
fi

# Create database backup
print_status "💾 Creating database backup..."
npm run db:backup || print_warning "Database backup failed, but continuing..."

# Generate Prisma client
print_status "🔧 Generating Prisma client..."
npm run prisma:generate

# Check migration status
print_status "🔍 Checking migration status..."
npx prisma migrate status

# Run migrations
print_status "🚀 Running database migrations..."
npm run prisma:migrate:deploy
if [ $? -ne 0 ]; then
    print_error "Database migration failed!"
    print_status "🔧 Attempting database recovery..."
    npm run db:recover
    print_status "🔧 Attempting to reset and re-run migrations..."
    npx prisma migrate reset --force
    npm run prisma:migrate:deploy
    if [ $? -ne 0 ]; then
        print_error "Database migration failed after reset!"
        print_status "💡 Manual intervention may be required"
        exit 1
    fi
fi
print_success "Migrations completed successfully"

# Initialize database
print_status "🌱 Initializing database..."
npm run db:init

# Seed database
print_status "🌱 Seeding database with initial data..."
npm run prisma:seed || print_warning "Database seeding failed, but continuing..."

cd ..

# 4. Skip Build for Local Development
print_status "🔨 Skipping build for local development..."
print_status "Application will run in development mode"

# 5. Stop Existing Processes
print_status "🛑 Stopping existing processes..."
# Stop any existing Next.js processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || true
# Kill any processes using port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 6. Start Application
print_status "🚀 Starting application..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found, installing..."
    npm install -g pm2
fi

# Start with PM2
print_status "Starting application with PM2..."
pm2 delete marinaobuv-local 2>/dev/null || true
# Start Next.js development server with PM2
cd web
pm2 start "npm run dev" --name marinaobuv-local
cd ..
if [ $? -ne 0 ]; then
    print_error "PM2 start failed!"
    pm2 logs marinaobuv-local --lines 50
    exit 1
fi

# Save PM2 configuration
pm2 save

# 7. Health Check
print_status "🔍 Running health checks..."

# Wait for application to start
print_status "Waiting for application to start..."
sleep 10

# Health check with retries
for i in {1..5}; do
    print_status "Health check attempt $i/5..."
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Health check passed!"
        break
    else
        print_warning "Health check failed, attempt $i/5"
        if [ $i -eq 5 ]; then
            print_error "Health check failed after 5 attempts"
            pm2 logs marinaobuv-local --lines 50
            exit 1
        fi
        sleep 5
    fi
done

# Database connectivity health check
print_status "🔍 Testing database connectivity..."
cd web
load_env ".env"
npx prisma db pull --print > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Database connectivity verified"
else
    print_error "Database connectivity failed!"
    print_status "🔧 Attempting to fix database connection..."
    npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        print_success "Database connection restored"
    else
        print_error "Database connection could not be restored"
        pm2 logs marinaobuv-local --lines 50
        exit 1
    fi
fi
cd ..

# 8. Final Status
print_status "📊 Final deployment status:"
echo "PM2 Status:"
pm2 status
echo ""
echo "Port 3000 Status:"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
echo ""
echo "Application URL:"
echo "http://localhost:3000"
echo ""

print_success "🎉 Local deployment completed successfully!"
print_success "✅ Application is running on port 3000"
print_success "✅ Database is properly configured"
print_success "✅ PM2 is managing the application"
print_status "💡 Use 'pm2 logs marinaobuv' to view logs"
print_status "💡 Use 'pm2 stop marinaobuv' to stop the application"
