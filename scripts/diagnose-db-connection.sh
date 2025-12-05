#!/bin/bash

# Database Connection Diagnostic Script
# This script investigates database connection issues WITHOUT making any changes
# Run this on the production server to diagnose connection problems

set +e  # Don't exit on errors - we want to see all diagnostics

echo "=========================================="
echo "Database Connection Diagnostic Script"
echo "=========================================="
echo ""

# 1. Check if we're in the right directory
echo "1. Checking current directory..."
pwd
echo ""

# 2. Check if .env file exists
echo "2. Checking for environment files..."
if [ -f "web/.env" ]; then
    echo "✅ Found web/.env"
    echo "   File size: $(wc -l < web/.env) lines"
elif [ -f "web/.env.production" ]; then
    echo "✅ Found web/.env.production"
elif [ -f "web/.env.local" ]; then
    echo "✅ Found web/.env.local"
else
    echo "❌ No .env file found in web/ directory"
    echo "   Available files:"
    ls -la web/.env* 2>/dev/null || echo "   No .env files found"
fi
echo ""

# 3. Check if DATABASE_URL is set (without loading it)
echo "3. Checking DATABASE_URL in .env file..."
if [ -f "web/.env" ]; then
    if grep -q "^DATABASE_URL=" web/.env; then
        echo "✅ DATABASE_URL found in web/.env"
        # Show first 30 chars only for security
        DB_URL_PREVIEW=$(grep "^DATABASE_URL=" web/.env | head -1 | cut -d'=' -f2- | cut -c1-30)
        echo "   Preview: ${DB_URL_PREVIEW}..."

        # Check if it's a postgres URL
        if echo "$DB_URL_PREVIEW" | grep -q "postgres"; then
            echo "   ✅ Appears to be a PostgreSQL URL"
        else
            echo "   ⚠️  Doesn't look like a PostgreSQL URL"
        fi
    else
        echo "❌ DATABASE_URL not found in web/.env"
        echo "   Looking for similar variables:"
        grep -i "database\|db_" web/.env | head -5 || echo "   No database-related variables found"
    fi
else
    echo "❌ Cannot check DATABASE_URL - .env file not found"
fi
echo ""

# 4. Check PostgreSQL service status
echo "4. Checking PostgreSQL service status..."
if command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL service is running"
        systemctl status postgresql --no-pager -l | head -5
    else
        echo "❌ PostgreSQL service is NOT running"
        echo "   Attempting to check status..."
        systemctl status postgresql --no-pager -l | head -10 || echo "   Cannot get service status"
    fi
elif command -v service &> /dev/null; then
    if service postgresql status &> /dev/null; then
        echo "✅ PostgreSQL service appears to be running"
    else
        echo "❌ PostgreSQL service status unknown"
    fi
else
    echo "⚠️  Cannot check PostgreSQL service (systemctl/service not available)"
fi
echo ""

# 5. Check if PostgreSQL is listening on a port
echo "5. Checking if PostgreSQL is listening on a port..."
if command -v netstat &> /dev/null; then
    PGSQL_PORTS=$(netstat -tlnp 2>/dev/null | grep -E ":(5432|5433)" || echo "")
    if [ -n "$PGSQL_PORTS" ]; then
        echo "✅ PostgreSQL appears to be listening:"
        echo "$PGSQL_PORTS"
    else
        echo "❌ PostgreSQL is not listening on ports 5432 or 5433"
    fi
elif command -v ss &> /dev/null; then
    PGSQL_PORTS=$(ss -tlnp 2>/dev/null | grep -E ":(5432|5433)" || echo "")
    if [ -n "$PGSQL_PORTS" ]; then
        echo "✅ PostgreSQL appears to be listening:"
        echo "$PGSQL_PORTS"
    else
        echo "❌ PostgreSQL is not listening on ports 5432 or 5433"
    fi
else
    echo "⚠️  Cannot check listening ports (netstat/ss not available)"
fi
echo ""

# 6. Test prisma-server.sh script
echo "6. Testing prisma-server.sh script..."
if [ -f "web/prisma-server.sh" ]; then
    echo "✅ prisma-server.sh exists"
    if [ -x "web/prisma-server.sh" ]; then
        echo "✅ prisma-server.sh is executable"
    else
        echo "⚠️  prisma-server.sh is not executable"
        echo "   Permissions: $(ls -l web/prisma-server.sh | awk '{print $1}')"
    fi

    # Try to run it and capture output
    echo "   Attempting to load environment..."
    cd web
    OUTPUT=$(./prisma-server.sh echo "TEST" 2>&1)
    EXIT_CODE=$?
    cd ..

    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ prisma-server.sh executed successfully"
        echo "$OUTPUT" | head -5
    else
        echo "❌ prisma-server.sh failed with exit code: $EXIT_CODE"
        echo "   Output:"
        echo "$OUTPUT"
    fi
else
    echo "❌ prisma-server.sh not found"
fi
echo ""

# 7. Try actual database connection test (with visible errors)
echo "7. Testing actual database connection (showing errors)..."
cd web
if [ -f "prisma-server.sh" ]; then
    echo "   Running: ./prisma-server.sh npx prisma db pull --print"
    # Don't redirect to /dev/null - we want to see the error
    ./prisma-server.sh npx prisma db pull --print 2>&1
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Database connection successful!"
    else
        echo "❌ Database connection failed with exit code: $EXIT_CODE"
        echo ""
        echo "   Common issues:"
        echo "   - DATABASE_URL is incorrect or missing"
        echo "   - PostgreSQL service is not running"
        echo "   - Database credentials are wrong"
        echo "   - Network/firewall blocking connection"
        echo "   - Database doesn't exist"
    fi
else
    echo "❌ Cannot test - prisma-server.sh not found"
fi
cd ..
echo ""

# 8. Check if Prisma is installed
echo "8. Checking Prisma installation..."
cd web
if [ -f "node_modules/.bin/prisma" ]; then
    echo "✅ Prisma is installed"
    ./node_modules/.bin/prisma --version 2>/dev/null || echo "   ⚠️  Cannot get Prisma version"
else
    echo "❌ Prisma is not installed (node_modules/.bin/prisma not found)"
    echo "   Run: npm install"
fi
cd ..
echo ""

# 9. Check node_modules
echo "9. Checking node_modules..."
if [ -d "web/node_modules" ]; then
    echo "✅ node_modules directory exists"
    MODULE_COUNT=$(find web/node_modules -maxdepth 1 -type d | wc -l)
    echo "   Found $MODULE_COUNT top-level modules"

    if [ -d "web/node_modules/@prisma" ]; then
        echo "✅ @prisma package is installed"
    else
        echo "❌ @prisma package is not installed"
    fi
else
    echo "❌ node_modules directory not found"
    echo "   Run: cd web && npm install"
fi
echo ""

# 10. Summary
echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""
echo "To investigate further, check:"
echo "1. Is PostgreSQL running? (systemctl status postgresql)"
echo "2. Is DATABASE_URL correct in web/.env?"
echo "3. Can you connect manually? (psql \$DATABASE_URL)"
echo "4. Are there firewall rules blocking the connection?"
echo "5. Check PostgreSQL logs: /var/log/postgresql/ or journalctl -u postgresql"
echo ""
echo "=========================================="
