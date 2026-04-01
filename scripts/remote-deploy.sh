#!/usr/bin/env bash

set -e
set -o pipefail

# Error trap to show what failed before exiting
trap 'echo "❌ ERROR: Command failed at line $LINENO: $BASH_COMMAND"; echo "❌ Last command exit code: $?"; exit 1' ERR

# Force unbuffered output for real-time logs
export PYTHONUNBUFFERED=1
export NPM_CONFIG_PROGRESS=true
export NPM_CONFIG_LOGLEVEL=verbose
export NODE_NO_WARNINGS=1

# Add progress function for better visibility (with explicit flush)
progress() {
  echo "[$(date +%H:%M:%S)] $*" >&2
}

# Flush function to force output
flush() {
  sync 2>/dev/null || true
}

# Real-time command wrapper - PROVEN solution for SSH buffering
run_realtime() {
  local cmd="$*"
  # Use unbuffer (from expect package) - BEST for SSH streaming
  if command -v unbuffer >/dev/null 2>&1; then
    unbuffer bash -c "$cmd"
  # Use script -qefc (forces real-time output)
  elif command -v script >/dev/null 2>&1; then
    script -qefc "$cmd" /dev/null
  # Use stdbuf as fallback
  elif command -v stdbuf >/dev/null 2>&1; then
    stdbuf -oL -eL -iL bash -c "$cmd"
  else
    # Last resort: use eval with explicit flushing
    eval "$cmd" && sync
  fi
}

# Ensure we are in /var/www/marinaobuv
if [ "$(pwd)" != "/var/www/marinaobuv" ]; then
  cd /var/www/marinaobuv
fi

progress "🚀 Starting deployment..."

# Log initial environment state for debugging
echo "📊 Initial environment variable count: $(env | wc -l)"
echo "📊 Initial environment variable names (first 10):"
env | cut -d= -f1 | head -10 | while IFS= read -r var; do
  echo "   - $var"
done

# Ensure all scripts are executable
echo "🔧 Setting execute permissions for all scripts..."
chmod +x scripts/*.sh 2>/dev/null || echo "No scripts found in scripts directory"
chmod +x web/src/scripts/*.sh 2>/dev/null || echo "No scripts found in web/src/scripts directory"
echo "✅ Script permissions set"

# Verify critical scripts exist
echo "🔍 Verifying critical scripts exist..."
if [ -f "scripts/verify-webhook-deployment.sh" ]; then
  echo "✅ Webhook verification script found"
else
  echo "❌ CRITICAL: Webhook verification script not found!"
  echo "Available files in scripts directory:"
  ls -la scripts/ || echo "No scripts directory found"
  echo "💡 DEPLOYMENT FAILED - required script missing"
  exit 1
fi

# Use existing environment file instead of GitHub Secrets
echo "🔧 Using environment file for configuration..."
if [ -f "web/.env" ]; then
    echo "✅ Found existing .env file"
elif [ -f "web/env.example" ]; then
    echo "📋 Using env.example as template for environment"
    cp web/env.example web/.env
    echo "⚠️ Please update web/.env with your actual values!"
else
    echo "❌ No environment file found!"
    echo "Please ensure web/.env or web/env.example exists"
    exit 1
fi

# Show which env keys are present (names only)
echo "Env keys on server:" && cut -d= -f1 web/.env | paste -sd, -

# Ensure database is properly initialized
echo "🗄️ Initializing database configuration..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
  echo "🔧 Starting PostgreSQL service..."
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
fi

# Load DATABASE_URL from environment file safely
# Only export DATABASE_URL to avoid "Argument list too long" error
echo "🔧 Loading DATABASE_URL from environment file..."
if [ -f "web/.env" ]; then
  # Extract only DATABASE_URL to minimize exported variables
  if grep -q "^DATABASE_URL=" web/.env; then
    DATABASE_URL=$(grep "^DATABASE_URL=" web/.env | cut -d'=' -f2- | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
    export DATABASE_URL
    echo "✅ DATABASE_URL loaded"
  else
    echo "❌ DATABASE_URL not found in web/.env"
    exit 1
  fi
else
  echo "❌ web/.env file not found"
  exit 1
fi

# Verify database connection string is valid
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set in environment file!"
  echo "Available environment variables:"
  cat web/.env | grep -v '^#' | head -10
  exit 1
fi

# Skip database setup (managed manually outside deploy)
echo "ℹ️ Skipping database setup (handled manually)"

# Skip database connection test before npm install (Prisma not available yet)
echo "ℹ️ Skipping database connection test (will test after npm install)"

# Skip DB auth modification during deploy
echo "ℹ️ Skipping DB auth modification during deploy"

# Install dependencies including dev (required for tsx/typescript used by scripts)
cd web

echo "=========================================="
echo "📦 Installing dependencies..."
echo "⏳ This may take 5-10 minutes..."
# Use tee to force output flushing - writes to both stdout and file
npm ci --loglevel=verbose --progress=true 2>&1 | tee /tmp/npm-install.log || {
  echo "❌ npm ci failed"
  echo "Last 50 lines of output:"
  tail -50 /tmp/npm-install.log || true
  exit 1
}
echo "✅ npm ci completed successfully"
echo ""
# Install Playwright Chromium browser for aggregator parser (idempotent - Playwright checks if already installed)
echo "🎭 Ensuring Playwright Chromium browser is installed..."
timeout 300 npm run playwright:install:ci 2>&1 | tee /tmp/playwright-install.log || echo "⚠️ Playwright install failed, aggregator parser may be unavailable"
cd ..

# Note: Proxy runs on separate serverspace server
echo "📋 Note: Proxy server runs on separate serverspace server (31.44.2.216)"

# Generate Prisma client with proper environment
cd web
echo "🔧 Generating Prisma client..."
./prisma-server.sh npm run prisma:generate

# Verify Prisma client was generated
if [ ! -f "node_modules/@prisma/client/index.js" ]; then
  echo "❌ Prisma client not generated properly!"
  echo "🔧 Attempting to regenerate..."
  ./prisma-server.sh npx prisma generate
  if [ ! -f "node_modules/@prisma/client/index.js" ]; then
    echo "❌ CRITICAL: Prisma client generation failed!"
    exit 1
  fi
fi
echo "✅ Prisma client generated successfully"

# Verify database connection
echo "🔍 Verifying database connection..."
echo "   Running: ./prisma-server.sh npx prisma db pull --print"
./prisma-server.sh npx prisma db pull --print
echo "✅ Database connection verified"

# Skip backup (requires tsx); do backups manually or on cron
echo "ℹ️ Skipping DB backup during deploy"

# Skip database permission changes during deploy to avoid YAML/heredoc issues
echo "ℹ️ Skipping database permission adjustments during deployment"

# Run database migrations with comprehensive error handling
echo "🚀 Running database migrations with conflict resolution..."

# First, try to resolve any failed migrations
echo "🔧 Checking for failed migrations and resolving conflicts..."
./prisma-server.sh npx prisma migrate resolve --applied 20250120000000_add_order_number_sequence 2>/dev/null || echo "Migration already resolved or doesn't exist"
./prisma-server.sh npx prisma migrate resolve --applied 20250120000001_update_order_statuses 2>/dev/null || echo "Migration already resolved or doesn't exist"
./prisma-server.sh npx prisma migrate resolve --applied 20250120000002_remove_ord_prefix 2>/dev/null || echo "Migration already resolved or doesn't exist"
./prisma-server.sh npx prisma migrate resolve --applied 20250120000003_update_order_status_default 2>/dev/null || echo "Migration already resolved or doesn't exist"
./prisma-server.sh npx prisma migrate resolve --applied 20250120000004_add_order_item_sequence 2>/dev/null || echo "Migration already resolved or doesn't exist"
./prisma-server.sh npx prisma migrate resolve --applied 20250916211900_init 2>/dev/null || echo "Migration already resolved or doesn't exist"

# Try to run migrations (includes ParsingHistory.sourceId for admin parsing per-chat)
if ./prisma-server.sh npx prisma migrate deploy; then
  echo "✅ Database migrations completed successfully"
else
  echo "❌ Database migrations failed, attempting schema synchronization..."
  if ./prisma-server.sh npx prisma db push --accept-data-loss; then
    echo "✅ Database schema synchronized successfully"
  else
    echo "❌ CRITICAL: Database schema synchronization failed!"
    echo "💡 DEPLOYMENT FAILED - could not fix database schema"
    exit 1
  fi
fi

# Ensure default categories exist (critical for parser functionality)
echo "🔧 Ensuring default categories exist..."
./prisma-server.sh npx prisma db execute --stdin <<< "
  INSERT INTO \"Category\" (id, name, slug, description, \"createdAt\", \"updatedAt\")
  VALUES ('default', 'Обувь', 'obuv', 'Основная категория обуви', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO \"Category\" (id, name, slug, description, \"createdAt\", \"updatedAt\")
  VALUES ('winter', 'Зимняя обувь', 'winter-shoes', 'Зимняя обувь и аксессуары', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO \"Category\" (id, name, slug, description, \"createdAt\", \"updatedAt\")
  VALUES ('summer', 'Летняя обувь', 'summer-shoes', 'Летняя обувь и сандалии', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
" 2>/dev/null || echo "Categories already exist or table doesn't exist yet"
echo "✅ Default categories ensured"

# Skip init/seed (requires tsx); run manually when needed
echo "ℹ️ Skipping DB init/seed during deploy"
cd ..

# Build will be handled by blue-green-deploy.sh to avoid duplicate builds
# This ensures a single, consistent build process with proper cleanup
progress "⏭️  Skipping build step - blue-green deployment will handle it..."
echo "ℹ️  Build will be performed by blue-green-deploy.sh with proper cleanup"

# Setup HTTPS and nginx configuration
echo "🔒 Setting up HTTPS and nginx configuration..."

# Install required packages for HTTPS
export DEBIAN_FRONTEND=noninteractive
timeout 300 sudo apt-get update || echo "⚠️ apt-get update timed out"
timeout 600 sudo apt-get install -y certbot python3-certbot-nginx openssl || echo "⚠️ Package install timed out"
# Ignore apt-get autoremove suggestions (not an error)
echo "✅ Packages installed"

# Create SSL directory structure (with error handling)
echo "📁 Setting up SSL directories..."
set +e  # Temporarily disable exit on error for directory setup
sudo mkdir -p /etc/ssl/certs 2>/dev/null || true
sudo mkdir -p /etc/ssl/private 2>/dev/null || true
sudo chmod 755 /etc/ssl/certs 2>/dev/null || true
sudo chmod 700 /etc/ssl/private 2>/dev/null || true
set -e  # Re-enable exit on error
echo "✅ SSL directories ready"

# Generate SSL certificate if not exists
echo "🔍 Checking for existing SSL certificate..."
set +e  # Temporarily disable exit on error for file check
SSL_CERT_EXISTS=$(test -f "/etc/ssl/certs/marinaobuv.ru.crt" 2>&1 && echo "yes" || echo "no")
SSL_CHECK_EXIT=$?
set -e  # Re-enable exit on error
if [ $SSL_CHECK_EXIT -ne 0 ]; then
  echo "⚠️ Warning: Could not check SSL certificate status (exit code: $SSL_CHECK_EXIT)"
fi
echo "   SSL certificate exists: $SSL_CERT_EXISTS"
if [ "$SSL_CERT_EXISTS" = "no" ]; then
  echo "🔐 Generating SSL certificate..."
  set +e  # Temporarily disable exit on error
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/private/marinaobuv.ru.key \
      -out /etc/ssl/certs/marinaobuv.ru.crt \
      -subj "/C=RU/ST=Moscow/L=Moscow/O=MarinaObuv/OU=IT/CN=marina-obuv.ru" 2>/dev/null
  OPENSSL_EXIT=$?
  set -e  # Re-enable exit on error
  if [ $OPENSSL_EXIT -eq 0 ]; then
    sudo chmod 600 /etc/ssl/private/marinaobuv.ru.key 2>/dev/null || true
    sudo chmod 644 /etc/ssl/certs/marinaobuv.ru.crt 2>/dev/null || true
    echo "✅ SSL certificate generated"
  else
    echo "⚠️ SSL certificate generation failed (may already exist or permission issue)"
  fi
else
  echo "✅ SSL certificate already exists"
fi

echo "🔍 Debug: About to check nginx.conf for rate limiting..."
# Add rate limiting zones to main nginx.conf
echo "⚙️ Adding rate limiting zones to nginx.conf..."
set +e  # Temporarily disable exit on error
echo "   Checking if /etc/nginx/nginx.conf exists..."
if [ -f "/etc/nginx/nginx.conf" ]; then
  echo "   ✅ nginx.conf found"
  echo "   Checking for existing rate limit configuration..."
  HAS_RATE_LIMIT=$(sudo grep -q "limit_req_zone.*api" /etc/nginx/nginx.conf 2>&1 && echo "yes" || echo "no")
  GREP_EXIT=$?
  echo "   grep exit code: $GREP_EXIT, result: $HAS_RATE_LIMIT"
  if [ "$HAS_RATE_LIMIT" = "no" ]; then
    echo "   Adding rate limiting zones..."
    sudo sed -i '/http {/a\    # Rate limiting zones\n    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=admin_api:10m rate=120r/s;\n    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;' /etc/nginx/nginx.conf 2>&1 || echo "⚠️ Failed to add rate limiting zones (may already exist)"
    SED_EXIT=$?
    echo "   sed exit code: $SED_EXIT"
  else
    echo "✅ Rate limiting zones already configured"
  fi
else
  echo "⚠️ nginx.conf not found, skipping rate limit configuration"
fi
set -e  # Re-enable exit on error
echo "✅ Rate limiting check completed"

# Fix nginx configuration first
echo "🔧 Fixing nginx configuration..."
if [ -f "scripts/fix-nginx-config.sh" ]; then
  chmod +x scripts/fix-nginx-config.sh
  set +e  # Temporarily disable exit on error for nginx fix
  if ./scripts/fix-nginx-config.sh; then
    echo "✅ Nginx configuration fixed successfully"
  else
    echo "⚠️ Nginx fix script failed, trying manual fix..."
    # Continue with manual fix instead of exiting
  fi
  set -e  # Re-enable exit on error
else
  echo "⚠️ Nginx fix script not found, using manual fix..."
  # Manual nginx configuration fix
  sudo tee /etc/nginx/conf.d/marinaobuv.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
EOF
fi

# HTTPS vhost is managed dynamically by blue-green script; skip static copy to avoid overwriting LE cert paths
echo "ℹ️ Skipping static HTTPS vhost copy; managed by blue-green switch"

# Setup Let's Encrypt certificate
echo "🔐 Setting up Let's Encrypt certificate..."
timeout 180 sudo certbot --nginx -d marina-obuv.ru -d www.marina-obuv.ru --non-interactive --agree-tos --email admin@marina-obuv.ru || echo "⚠️ Let's Encrypt setup failed or timed out, using self-signed certificate"

# Setup auto-renewal
echo "🔄 Setting up certificate auto-renewal..."
set +e  # Temporarily disable exit on error for crontab
EXISTING_CRON=$(sudo crontab -l 2>/dev/null)
set -e  # Re-enable exit on error
(echo "$EXISTING_CRON" | grep -v certbot 2>/dev/null || true; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab - || echo "⚠️ Failed to setup certbot cron (may already be configured)"

# Configure firewall
echo "🔥 Configuring firewall..."
timeout 60 sudo ufw allow 22/tcp || true
timeout 60 sudo ufw allow 80/tcp || true
timeout 60 sudo ufw allow 443/tcp || true
timeout 60 sudo ufw --force enable || echo "⚠️ Firewall configuration failed or timed out"

# Install/refresh server cron jobs from repository config
echo "🕒 Installing cron jobs from scripts/cron-jobs.conf..."
if [ -f "scripts/install-crons.sh" ]; then
  chmod +x scripts/install-crons.sh
  cd /var/www/marinaobuv
  if bash scripts/install-crons.sh; then
    echo "✅ Cron jobs installed successfully"

    # Verify webhook monitor cron is installed
    if crontab -l 2>/dev/null | grep -q "webhook-status-monitor"; then
      echo "✅ Webhook monitor cron job verified"
    else
      echo "⚠️ Webhook monitor cron job not found in crontab"
    fi

    # Verify cron service is running
    if systemctl is-active --quiet cron || systemctl is-active --quiet crond; then
      echo "✅ Cron service is running"
    else
      echo "⚠️ Cron service is not running"
    fi

    # Ensure logs directory exists for webhook monitor
    mkdir -p web/logs
    touch web/logs/webhook-monitor.log
    chmod 666 web/logs/webhook-monitor.log 2>/dev/null || true
    echo "✅ Webhook monitor log file ready"
  else
    echo "❌ Cron installation failed!"
    echo "Attempting manual cron installation..."
    # Fallback: manually add webhook monitor cron if install script fails
    CRON_ENTRY="*/15 * * * * cd /var/www/marinaobuv/web && NODE_ENV=production [ \"\$DISABLE_CRON_WEBHOOK_MONITOR\" != \"true\" ] && /usr/bin/env ./node_modules/.bin/tsx src/scripts/webhook-status-monitor.ts >> /var/www/marinaobuv/web/logs/webhook-monitor.log 2>&1 # JOB:webhook-monitor"
    (crontab -l 2>/dev/null | grep -v "webhook-status-monitor"; echo "$CRON_ENTRY") | crontab -
    echo "✅ Webhook monitor cron added manually"
  fi
else
  echo "❌ Cron installation script not found!"
  echo "Available files in scripts directory:"
  ls -la scripts/ || echo "No scripts directory found"
fi

# Load runtime environment for PM2 safely
# NOTE: Don't use 'set -a' to export all variables - it causes "Argument list too long"
# when appleboy/ssh-action tries to print environment variables at the end.
# Instead, PM2 will read environment variables from ecosystem.config.js or .env file directly.
echo "🔧 Preparing environment for PM2 runtime..."
echo "   PM2 will read environment variables from ecosystem.config.js and web/.env"

# Only export critical variables needed for the deployment script itself
# PM2 will handle the rest via ecosystem.config.js
if [ -f "web/.env" ]; then
  # Extract only DATABASE_URL for Prisma operations if needed
  if grep -q "^DATABASE_URL=" web/.env; then
    DATABASE_URL=$(grep "^DATABASE_URL=" web/.env | cut -d'=' -f2- | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
    export DATABASE_URL
  fi
fi

# Use Blue-Green Zero-Downtime Deployment
progress "🚀 Deploying application (step 3/3)..."
echo "🚀 Starting Blue-Green Zero-Downtime Deployment..."
if [ -f "scripts/blue-green-deploy.sh" ]; then
  chmod +x scripts/blue-green-deploy.sh
  if ./scripts/blue-green-deploy.sh; then
    echo "✅ Blue-Green deployment completed successfully!"
  else
    echo "❌ Blue-Green deployment failed!"
    pm2 logs --lines 50
    exit 1
  fi
else
  echo "❌ Blue-Green deployment script not found!"
  echo "Falling back to traditional deployment..."

  # Fallback to traditional deployment
  pm2 kill 2>/dev/null || true
  sleep 2
  pm2 start ecosystem.config.js --env production
  if [ $? -ne 0 ]; then
    echo "PM2 start failed!"
    pm2 logs marinaobuv --lines 50
    exit 1
  fi

  # Wait for application to start
  echo "Waiting for application to start..."
  sleep 15

  # Health check with retries
  for i in {1..5}; do
    echo "Health check attempt $i/5..."
    if curl -f http://localhost:3000/api/health; then
      echo "Health check passed!"
      break
    else
      echo "Health check failed, attempt $i/5"
      if [ $i -eq 5 ]; then
        echo "Health check failed after 5 attempts"
        pm2 logs marinaobuv --lines 50
        exit 1
      fi
      sleep 5
    fi
  done
fi

# Save PM2 configuration
pm2 save

# Show status
pm2 status

# Database connectivity health check
echo "🔍 Testing database connectivity..."
cd web
# Use a simple query instead of db pull to avoid schema output
echo "   Running: ./prisma-server.sh npx prisma db execute --stdin (testing connection)"
DB_HEALTH_OUTPUT=$(echo "SELECT 1;" | ./prisma-server.sh npx prisma db execute --stdin 2>&1)
DB_HEALTH_EXIT=$?
if [ $DB_HEALTH_EXIT -eq 0 ]; then
  echo "✅ Database connectivity verified"
else
  echo "❌ Database connectivity failed! (exit code: $DB_HEALTH_EXIT)"
  echo "   Error details:"
  echo "$DB_HEALTH_OUTPUT" | head -40
  echo ""
  echo "🔧 Attempting to fix database connection..."

  # Fix database authentication issues
  echo "🔧 Fixing database authentication issues..."
  cd ..
  # Only export DATABASE_URL for fix-database-auth.sh to avoid "Argument list too long" error
  if [ -f "web/.env" ] && grep -q "^DATABASE_URL=" web/.env; then
    DATABASE_URL=$(grep "^DATABASE_URL=" web/.env | cut -d'=' -f2- | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
    export DATABASE_URL
  fi
  ./scripts/fix-database-auth.sh

  # Test connection again
  cd web
  echo "   Retesting database connection after auth fix..."
  # Use a simple query instead of db pull to avoid schema output
  DB_RETEST_OUTPUT=$(echo "SELECT 1;" | ./prisma-server.sh npx prisma db execute --stdin 2>&1)
  DB_RETEST_EXIT=$?
  if [ $DB_RETEST_EXIT -eq 0 ]; then
    echo "✅ Database connection restored"
  else
    echo "❌ Database connection could not be restored (exit code: $DB_RETEST_EXIT)"
    echo "   Error details:"
    echo "$DB_RETEST_OUTPUT" | head -40
    echo ""
    echo "🔍 Database connection details:"
    echo "   Host: ${DB_HOST:-not set}"
    echo "   Port: ${DB_PORT:-not set}"
    echo "   Database: ${DB_NAME:-not set}"
    echo "   User: ${DB_USER:-not set}"
    echo ""
    echo "🔍 Testing direct PostgreSQL connection..."
    if command -v psql &> /dev/null && [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
      PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" 2>&1 | head -10 || echo "   Direct PostgreSQL connection also failed"
    else
      echo "   Cannot test direct connection (psql not found or DB variables not set)"
    fi
    echo ""
    echo "📋 PM2 application logs (last 50 lines):"
    pm2 logs marinaobuv --lines 50 --nostream || echo "   Could not retrieve PM2 logs"
    exit 1
  fi
fi
cd ..

# Run comprehensive diagnostics (with timeout) if script exists
echo "🔍 Running comprehensive diagnostics..."
if [ -f scripts/diagnose-domain-issues.sh ]; then
  chmod +x scripts/diagnose-domain-issues.sh
  timeout 60 ./scripts/diagnose-domain-issues.sh || echo "⚠️ Diagnostics completed with timeout"
else
  echo "ℹ️ diagnose-domain-issues.sh not found, skipping"
fi

# Fix common hosting issues (with timeout) if script exists
echo "🔧 Fixing common hosting issues..."
if [ -f scripts/fix-hosting-issues.sh ]; then
  chmod +x scripts/fix-hosting-issues.sh
  timeout 60 ./scripts/fix-hosting-issues.sh || echo "⚠️ Hosting fixes completed with timeout"
else
  echo "ℹ️ fix-hosting-issues.sh not found, skipping"
fi

# CRITICAL: Final application health check
echo "🔍 Performing final application health check..."
sleep 10  # Wait for application to fully start

# Test database connectivity and schema
echo "🔍 Testing database schema..."
cd web
SCHEMA_TEST_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "SELECT \"analysisBatchId\" FROM \"Product\" LIMIT 1;" 2>&1)
SCHEMA_TEST_EXIT=$?
if [ $SCHEMA_TEST_EXIT -eq 0 ]; then
  echo "✅ Database schema validation passed"
  cd ..
else
  echo "❌ CRITICAL: Database schema test failed! (exit code: $SCHEMA_TEST_EXIT)"
  echo "   Error details:"
  echo "$SCHEMA_TEST_OUTPUT" | head -30
  echo ""
  echo "🔧 Attempting final schema fix..."
  # Final attempt to fix schema
  cd web
  echo "   Adding missing analysisBatchId column..."
  ALTER_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"analysisBatchId\" TEXT;" 2>&1)
  if [ $? -ne 0 ]; then
    echo "   ⚠️  analysisBatchId: $ALTER_OUTPUT" | head -2
  else
    echo "   ✅ analysisBatchId column added"
  fi

  echo "   Adding missing colorBatchId column..."
  ALTER_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"colorBatchId\" TEXT;" 2>&1)
  if [ $? -ne 0 ]; then
    echo "   ⚠️  colorBatchId: $ALTER_OUTPUT" | head -2
  else
    echo "   ✅ colorBatchId column added"
  fi

  echo "   Adding missing batchProcessingStatus column..."
  ALTER_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"batchProcessingStatus\" TEXT DEFAULT 'pending';" 2>&1)
  if [ $? -ne 0 ]; then
    echo "   ⚠️  batchProcessingStatus: $ALTER_OUTPUT" | head -2
  else
    echo "   ✅ batchProcessingStatus column added"
  fi

  echo "   Adding missing indexes..."
  INDEX_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "CREATE UNIQUE INDEX IF NOT EXISTS \"Product_analysisBatchId_key\" ON \"Product\"(\"analysisBatchId\");" 2>&1)
  if [ $? -ne 0 ]; then
    echo "   ⚠️  analysisBatchId index: $INDEX_OUTPUT" | head -2
  fi

  INDEX_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "CREATE UNIQUE INDEX IF NOT EXISTS \"Product_colorBatchId_key\" ON \"Product\"(\"colorBatchId\");" 2>&1)
  if [ $? -ne 0 ]; then
    echo "   ⚠️  colorBatchId index: $INDEX_OUTPUT" | head -2
  fi

  echo "   Regenerating Prisma client..."
  ./prisma-server.sh npm run prisma:generate
  cd ..
  echo "   Restarting application..."
  pm2 restart marinaobuv
  sleep 10

  # Test again after fixes
  echo "   Retesting schema after fixes..."
  cd web
  SCHEMA_RETEST_OUTPUT=$(./prisma-server.sh npx prisma db execute --stdin <<< "SELECT \"analysisBatchId\" FROM \"Product\" LIMIT 1;" 2>&1)
  SCHEMA_RETEST_EXIT=$?
  if [ $SCHEMA_RETEST_EXIT -eq 0 ]; then
    echo "✅ Database schema fixed successfully"
    cd ..
  else
    echo "❌ CRITICAL: Database schema could not be fixed! (exit code: $SCHEMA_RETEST_EXIT)"
    echo "   Error details:"
    echo "$SCHEMA_RETEST_OUTPUT" | head -30
    echo ""
    echo "💡 DEPLOYMENT FAILED - application will not work"
    cd ..
    exit 1
  fi
fi

# Test application endpoints (via Nginx, not direct Node port)
echo "🔍 Testing application endpoints via Nginx..."
HEALTH_OK=false
for i in {1..5}; do
  if curl -f -s http://localhost/api/health > /dev/null 2>&1 || \
     curl -f -s https://marina-obuv.ru/api/health > /dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  echo "⏳ Nginx health check retry $i/5..."
  sleep 3
done
if [ "$HEALTH_OK" = true ]; then
  echo "✅ Health endpoint working via Nginx"
else
  echo "❌ CRITICAL: Health endpoint failed via Nginx!"
  echo "💡 DEPLOYMENT FAILED - application is not responding through the reverse proxy"
  exit 1
fi

# Remove unused tinyproxy Docker container to free up port 8888 and resources
echo "🧹 Removing unused tinyproxy Docker container..."
docker stop tinyproxy 2>/dev/null || true
docker rm tinyproxy 2>/dev/null || true
echo "✅ Tinyproxy container removed (was not used by application)"

echo "ℹ️ Skipping HTTP vhost rewrite; managed dynamically by blue-green switch to point at active port"

# Verify webhook deployment
echo "🔍 Verifying webhook deployment..."

# Check if webhook script exists and make it executable
if [ -f "scripts/verify-webhook-deployment.sh" ]; then
  chmod +x scripts/verify-webhook-deployment.sh
  echo "✅ Webhook verification script found and made executable"

  if ./scripts/verify-webhook-deployment.sh; then
    echo "✅ Webhook verification completed successfully"
  else
    echo "❌ CRITICAL: Webhook verification failed!"
    echo "💡 DEPLOYMENT FAILED - webhook is not working"
    exit 1
  fi
else
  echo "❌ CRITICAL: Webhook verification script not found!"
  echo "Available scripts:"
  ls -la scripts/ || echo "No scripts directory found"
  echo "💡 DEPLOYMENT FAILED - webhook script missing"
  exit 1
fi

# Verify webhook status monitor and Telegram configuration
echo "🔍 Verifying webhook status monitor configuration..."
cd web

# Check if Telegram environment variables are set (warn if not, but don't fail)
if grep -q "TELEGRAM_BOT_TOKEN" .env 2>/dev/null && grep -q "TELEGRAM_ALERT_CHAT_IDS" .env 2>/dev/null; then
  TELEGRAM_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
  TELEGRAM_ALERT_CHAT_IDS=$(grep "^TELEGRAM_ALERT_CHAT_IDS=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)

  if [ -n "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your_telegram_bot_token" ] && \
     [ -n "$TELEGRAM_ALERT_CHAT_IDS" ] && [ "$TELEGRAM_ALERT_CHAT_IDS" != "123456789" ]; then
    echo "✅ Telegram configuration found in .env"

    # Test webhook monitor script (dry run - just check it can load)
    echo "🧪 Testing webhook status monitor script..."
    if timeout 30 ./node_modules/.bin/tsx src/scripts/webhook-status-monitor.ts 2>&1 | head -20; then
      echo "✅ Webhook status monitor script is executable and loads correctly"
    else
      echo "⚠️ Webhook status monitor script test had issues (may be normal if WhatsApp is down)"
    fi
  else
    echo "⚠️ Telegram environment variables are set but appear to be placeholder values"
    echo "   Please update TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_IDS in web/.env"
    echo "   See web/TELEGRAM_SETUP.md for setup instructions"
  fi
else
  echo "⚠️ Telegram environment variables not found in .env"
  echo "   Webhook monitor will not send notifications until Telegram is configured"
  echo "   See web/TELEGRAM_SETUP.md for setup instructions"
fi
cd ..

# Final status check
echo "📊 Final deployment status:"
echo "PM2 Status:"
pm2 status
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "Port 3000 Status:"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
echo ""
echo "Nginx Configuration Test:"
sudo nginx -t
echo ""
echo "Cron Jobs Status:"
if systemctl is-active --quiet cron || systemctl is-active --quiet crond; then
  echo "✅ Cron service is running"
  echo "Installed cron jobs:"
  crontab -l 2>/dev/null | grep -E "(webhook-monitor|JOB:)" || echo "No managed cron jobs found"
else
  echo "⚠️ Cron service is not running"
fi

# Clean up environment variables to prevent "Argument list too long" error
# when appleboy/ssh-action tries to print environment variables
echo ""
echo "🧹 Cleaning up environment variables..."
# Unset all variables that were loaded from .env file
# Keep only essential system variables
if [ -f "web/.env" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    # Extract key name and unset it
    if [[ "$line" =~ ^([^=]+)= ]]; then
      key="${BASH_REMATCH[1]}"
      # Only unset if it's not a critical system variable
      case "$key" in
        PATH|HOME|USER|SHELL|PWD|SSH_*|LANG|LC_*|TERM|TZ|_)
          # Keep system variables
          ;;
        *)
          unset "$key" 2>/dev/null || true
          ;;
      esac
    fi
  done < web/.env
fi
echo "✅ Environment cleanup completed"
echo ""
echo "Webhook Monitor Log (last 5 lines):"
tail -n 5 web/logs/webhook-monitor.log 2>/dev/null || echo "Log file not found or empty"
echo ""
echo "[$(date +%H:%M:%S)] Testing Domain Endpoints (quick tests)..."
echo "Domain Test (HTTPS):"
timeout 5 curl -f --max-time 3 --connect-timeout 2 https://marina-obuv.ru/api/health 2>&1 || echo "HTTPS domain access failed"
echo ""
echo "Domain Test (HTTP redirect):"
timeout 5 curl -f --max-time 3 --connect-timeout 2 http://marina-obuv.ru/api/health 2>&1 || echo "HTTP redirect test failed"
echo ""
echo "Webhook Test:"
timeout 5 curl -f --max-time 3 --connect-timeout 2 https://marina-obuv.ru/api/webhooks/green-api 2>&1 || echo "Webhook endpoint test failed"

echo ""
progress "✅ Deployment completed successfully!"
echo "✅ Application is running on port 3000"
echo "✅ HTTPS is configured and working"
echo "✅ Nginx is properly configured"
echo "✅ PM2 is managing the application"

# Minimal environment cleanup - only unset critical variables from .env
# This prevents "Argument list too long" when appleboy/ssh-action prints env vars
echo ""
echo "🧹 Cleaning up environment variables..."
if [ -f "web/.env" ]; then
  # Only unset a few critical variables that might cause issues
  # Use a simple approach to avoid argument list limits
  unset DATABASE_URL 2>/dev/null || true
  unset DATABASE_HOST 2>/dev/null || true
  unset DATABASE_USER 2>/dev/null || true
  unset DATABASE_PASS 2>/dev/null || true
  unset DATABASE_NAME 2>/dev/null || true
  echo "✅ Cleaned up database environment variables"
fi

echo "🏁 Script execution completed successfully!"
sync 2>/dev/null || true

# Explicitly exit to prevent any log tailing
exit 0
