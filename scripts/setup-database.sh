#!/bin/bash

# Database Setup Script for MarinaObuv
# This script sets up the PostgreSQL database and user for the application

set -e

echo "🗄️ Setting up database for MarinaObuv..."

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

# Create database user
echo "🔧 Creating database user: $DB_USER"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User $DB_USER may already exist"

# Create database
echo "🔧 Creating database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_NAME may already exist"

# Grant privileges
echo "🔧 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || echo "Privileges may already be granted"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || echo "User may already have CREATEDB privilege"

# Test connection
echo "🔍 Testing database connection..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully"
    echo "✅ User $DB_USER can connect to database $DB_NAME"
else
    echo "❌ Database connection test failed"
    echo "🔍 Testing with different connection methods..."
    
    # Try local connection
    PGPASSWORD="$DB_PASS" psql -h localhost -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || echo "Local connection failed"
    
    # Try without host specification
    PGPASSWORD="$DB_PASS" psql -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || echo "Default connection failed"
    
    exit 1
fi

echo "🎉 Database setup completed!"
