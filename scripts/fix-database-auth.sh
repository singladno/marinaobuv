#!/bin/bash

# Database Authentication Fix Script
# This script fixes database authentication issues

set -e

echo "🔧 Fixing database authentication issues..."

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

# Parse DATABASE_URL to extract connection details
echo "🔍 Parsing DATABASE_URL..."
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')

echo "Database details: Host=$DB_HOST, Port=$DB_PORT, Database=$DB_NAME, User=$DB_USER"

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "🔧 Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    else
        echo "⏳ Waiting for PostgreSQL... ($i/30)"
        sleep 2
    fi
done

# Drop and recreate user to fix authentication issues
echo "🔧 Dropping and recreating user: $DB_USER"
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || echo "User $DB_USER may not exist"

# Create user with proper authentication
echo "🔧 Creating user with proper authentication..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;" 2>/dev/null || echo "Failed to create user"

# Create database if it doesn't exist
echo "🔧 Creating database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_NAME may already exist"

# Grant all privileges
echo "🔧 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || echo "Failed to grant privileges"

# Grant schema privileges
echo "🔧 Granting schema privileges..."
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || echo "Failed to grant schema privileges"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;" 2>/dev/null || echo "Failed to grant table privileges"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;" 2>/dev/null || echo "Failed to grant sequence privileges"

# Set default privileges for future objects
echo "🔧 Setting default privileges..."
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" 2>/dev/null || echo "Failed to set default table privileges"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;" 2>/dev/null || echo "Failed to set default sequence privileges"

# Test connection
echo "🔍 Testing database connection..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database authentication fixed successfully"
    echo "✅ User $DB_USER can connect to database $DB_NAME"
else
    echo "❌ Database connection test failed"
    echo "🔍 Testing with different connection methods..."
    
    # Try local connection
    PGPASSWORD="$DB_PASS" psql -h localhost -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || echo "Local connection failed"
    
    # Try without host specification
    PGPASSWORD="$DB_PASS" psql -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || echo "Default connection failed"
    
    # Show PostgreSQL configuration
    echo "🔍 PostgreSQL configuration:"
    sudo -u postgres psql -c "SHOW hba_file;"
    sudo -u postgres psql -c "SHOW config_file;"
    
    exit 1
fi

echo "🎉 Database authentication fix completed!"
