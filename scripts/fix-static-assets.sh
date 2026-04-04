#!/usr/bin/env bash

set -e

echo "🔍 Diagnosing static assets issue..."

# Check if we're in the right directory
if [ ! -d "web" ]; then
  echo "❌ Error: web directory not found. Please run from project root."
  exit 1
fi

cd web

# 1. Check if Next.js app is running
echo ""
echo "1️⃣ Checking if Next.js app is running..."
if pm2 list | grep -q "marinaobuv.*online"; then
  echo "✅ PM2 app is running"
  pm2 list | grep marinaobuv
else
  echo "❌ PM2 app is NOT running!"
  echo "   Attempting to start..."
  cd ..
  pm2 start ecosystem.config.js --env production
  sleep 5
  cd web
fi

# 2. Check if .next directory exists
echo ""
echo "2️⃣ Checking if .next directory exists..."
if [ -d ".next" ]; then
  echo "✅ .next directory exists"
  if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    echo "   Build ID: $BUILD_ID"
  else
    echo "❌ BUILD_ID file missing - build may be incomplete"
  fi

  # Check static directory
  if [ -d ".next/static" ]; then
    echo "✅ .next/static directory exists"
    STATIC_COUNT=$(find .next/static -type f | wc -l)
    echo "   Found $STATIC_COUNT static files"
  else
    echo "❌ .next/static directory missing!"
  fi
else
  echo "❌ .next directory does NOT exist!"
  echo "   This means the app was never built or the build was deleted."
  echo "   Rebuilding..."
  cd ..
  cd web
  npm run build
  cd ..
fi

# 3. Check if app responds on localhost:3000
echo ""
echo "3️⃣ Testing app response on localhost:3000..."
if curl -f -s http://localhost:3000/api/health > /dev/null; then
  echo "✅ App is responding to health check"
else
  echo "❌ App is NOT responding on localhost:3000"
  echo "   Checking PM2 logs..."
  pm2 logs marinaobuv --lines 20 --nostream
  exit 1
fi

# 4. Test static file access directly from Next.js
echo ""
echo "4️⃣ Testing static file access directly from Next.js..."
STATIC_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/static/css/app.css 2>/dev/null || echo "000")
if [ "$STATIC_TEST" = "200" ] || [ "$STATIC_TEST" = "404" ]; then
  echo "✅ Next.js is responding to static file requests (status: $STATIC_TEST)"
  if [ "$STATIC_TEST" = "404" ]; then
    echo "   ⚠️  File not found, but server is responding (this is normal if file doesn't exist)"
  fi
else
  echo "❌ Next.js is NOT responding correctly to static file requests (status: $STATIC_TEST)"
  echo "   This suggests the app is not running in production mode or has an error"
fi

# 5. Check NODE_ENV
echo ""
echo "5️⃣ Checking environment..."
if [ -f "../ecosystem.config.js" ]; then
  echo "   Checking ecosystem.config.js..."
  if grep -q "NODE_ENV.*production" ../ecosystem.config.js; then
    echo "✅ Production mode configured in ecosystem.config.js"
  else
    echo "⚠️  Production mode may not be set in ecosystem.config.js"
  fi
fi

# 6. Check nginx configuration
echo ""
echo "6️⃣ Checking nginx configuration..."
if [ -f "/etc/nginx/conf.d/marinaobuv.conf" ]; then
  if grep -q "_next/static" /etc/nginx/conf.d/marinaobuv.conf; then
    echo "✅ Nginx has _next/static location configured"
  else
    echo "❌ Nginx missing _next/static location!"
    echo "   Fixing nginx config..."
    sudo tee /etc/nginx/conf.d/marinaobuv.conf > /dev/null << 'EOF'
# HTTP server (HTTPS disabled temporarily for testing)
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files - CRITICAL: Must come before other locations
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }
}
EOF
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configuration updated and reloaded"
  fi
else
  echo "⚠️  Nginx config file not found at /etc/nginx/conf.d/marinaobuv.conf"
fi

# 7. Final recommendation
echo ""
echo "📋 Summary and Recommendations:"
echo ""
echo "If static files are still not loading, try:"
echo "  1. Rebuild the app: cd web && npm run build"
echo "  2. Restart PM2: pm2 restart marinaobuv"
echo "  3. Check PM2 logs: pm2 logs marinaobuv"
echo "  4. Verify .next directory exists: ls -la web/.next"
echo "  5. Test directly: curl http://localhost:3000/_next/static/css/app.css"
echo ""
echo "✅ Diagnostic complete!"
