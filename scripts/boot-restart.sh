#!/usr/bin/env bash

set -euo pipefail

LOG_FILE="/var/www/marinaobuv/logs/boot-restart.log"
mkdir -p /var/www/marinaobuv/logs || true
touch "$LOG_FILE" || true

log() {
  echo "[$(date -Is)] $*" | tee -a "$LOG_FILE"
}

cd /var/www/marinaobuv || { echo "/var/www/marinaobuv not found"; exit 1; }

# Ensure local node binaries are on PATH for non-interactive shells
export PATH="/var/www/marinaobuv/web/node_modules/.bin:$PATH"
export NODE_ENV=production

log "Starting boot recovery script"

# 1) Git: force HTTPS remote (avoid SSH keys), stash local changes and pull latest main
if [ -d .git ]; then
  log "Setting git remote to HTTPS"
  git remote set-url origin https://github.com/singladno/marinaobuv.git || true
  if ! git diff --quiet || ! git diff --cached --quiet; then
    log "Stashing local changes before pull"
    git stash push -u -m auto-stash-on-boot || true
  fi
  log "Pulling latest from origin/main"
  git pull --rebase || true
fi

# 2) Install production deps (idempotent), disable husky/prepare scripts in prod
log "Installing production dependencies in web/ (HUSKY=0, NPM_CONFIG_IGNORE_SCRIPTS=1)"
cd web
if [ -f package-lock.json ]; then
  HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=1 npm ci --omit=dev --no-audit --no-fund || HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=1 npm install --omit=dev --no-audit --no-fund
else
  HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=1 npm install --omit=dev --no-audit --no-fund
fi

# Ensure tsx exists for cron/scripts
if [ ! -x node_modules/.bin/tsx ]; then
  log "Installing tsx locally (missing binary)"
  npm install tsx@^4 --no-audit --no-fund
fi

# Optional: regenerate prisma client (fast, no schema change)
if [ -f prisma/schema.prisma ]; then
  npx prisma generate || true
fi

cd /var/www/marinaobuv

# 3) PM2: start app so nginx has an upstream (prevents 502 after VM reboot)
# Avoid EADDRINUSE: stop any app that might be on 3000 (from PM2 resurrect or previous boot)
# so only one process is started (either blue-green blue or single marinaobuv).
log "Stopping any existing app on port 3000 to avoid EADDRINUSE"
pm2 delete marinaobuv marinaobuv-blue marinaobuv-green 2>/dev/null || true
sleep 1

if [ -f "ecosystem-blue-green.config.js" ]; then
  log "Starting blue-green: marinaobuv-blue on port 3000 (nginx will proxy to 3000)"
  pm2 start ecosystem-blue-green.config.js --only marinaobuv-blue --env production
else
  log "Reloading PM2 with ecosystem.config.js"
  pm2 start ecosystem.config.js --env production
  pm2 scale marinaobuv 1 || true
fi
pm2 delete prisma-studio 2>/dev/null || true

# Note: Groq proxy runs on separate serverspace server (31.44.2.216)
log "Note: Groq proxy server runs on separate serverspace server"
log "Proxy connectivity will be tested via nginx configuration"

pm2 save || true

# Ensure PM2 resurrect on reboot (idempotent; prevents 502 after VM restart)
log "Ensuring PM2 startup on boot (resurrect saved processes)"
sudo env PATH="$PATH" pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

# 4) Nginx: ensure proxy to localhost:3000 and fix configuration
log "Fixing nginx configuration..."
if [ -f "scripts/fix-nginx-config.sh" ]; then
  chmod +x scripts/fix-nginx-config.sh
  if ./scripts/fix-nginx-config.sh; then
    log "Nginx configuration fixed successfully"
  else
    log "ERROR: Failed to fix nginx configuration"
    exit 1
  fi
else
  log "Nginx fix script not found, using manual fix..."
  NGINX_CONF="/etc/nginx/conf.d/marinaobuv.conf"
  sudo tee "$NGINX_CONF" >/dev/null <<'EOF'
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    location / {
        proxy_pass http://localhost:3000;
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
  if ! sudo nginx -t; then
    log "ERROR: Nginx configuration test failed"
    exit 1
  fi
  sudo systemctl restart nginx || true
fi

# 5) Install/refresh cron jobs (includes proxy monitoring)
if [ -f scripts/install-crons.sh ]; then
  log "Installing/updating cron jobs (including proxy monitoring)"
  bash scripts/install-crons.sh || true
fi

# 5.1) Note: Proxy monitoring runs on separate serverspace server
log "Note: Groq proxy monitoring runs on separate serverspace server (31.44.2.216)"

# 6) PM2 logrotate and journald vacuum
if ! pm2 module:info pm2-logrotate >/dev/null 2>&1; then
  pm2 install pm2-logrotate || true
fi
pm2 set pm2-logrotate:max_size 10M || true
pm2 set pm2-logrotate:retain 7 || true
pm2 set pm2-logrotate:compress true || true
pm2 save || true

sudo journalctl --vacuum-size=200M || true

# Ensure Groq proxy port is open in firewall
log "Ensuring Groq proxy port 3001 is open in firewall..."
sudo ufw allow 3001/tcp || true

# 7) Health checks
log "Checking app on localhost:3000"
curl -s -I http://127.0.0.1:3000 | head -n1 || true
log "Checking nginx /health"
curl -s -I http://127.0.0.1/health | head -n1 || curl -s -I http://127.0.0.1 | head -n1 || true
log "Note: Groq proxy runs on separate serverspace server (31.44.2.216)"

# 8) Configure webhook after deployment
log "Configuring Green API webhook..."
cd web
if [ -f ".env" ] && [ -n "$(grep GREEN_API_INSTANCE_ID .env)" ]; then
  log "Setting up webhook configuration"
  export $(grep -v '^#' .env | xargs)
  if npx tsx src/scripts/configure-webhook.ts; then
    log "Webhook configured successfully"
  else
    log "Webhook configuration failed, but continuing"
  fi
else
  log "No Green API credentials found, skipping webhook setup"
fi
cd ..

# 9) Remove/disable legacy VPN services not used anymore
for svc in openvpn@client.service openvpn.service wireguard.service marinaobuv-surfshark.service; do
  if systemctl list-unit-files | awk '{print $1}' | grep -qx "$svc"; then
    log "Disabling legacy service: $svc"
    sudo systemctl disable --now "$svc" || true
  fi
done

log "Boot recovery script completed"

# 10) Ensure this script runs on every reboot (prevents 502 after VM restart)
UNIT_FILE="/etc/systemd/system/marinaobuv-boot.service"
if [ ! -f "$UNIT_FILE" ]; then
  log "Installing systemd unit to auto-run this script on reboot"
  sudo tee "$UNIT_FILE" >/dev/null <<'EOF'
[Unit]
Description=MarinaObuv boot recovery
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/var/www/marinaobuv
ExecStart=/bin/bash /var/www/marinaobuv/scripts/boot-restart.sh
StandardOutput=journal
StandardError=journal
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
fi
sudo systemctl daemon-reload 2>/dev/null || true
sudo systemctl enable marinaobuv-boot.service 2>/dev/null || true
log "Systemd unit installed/enabled. Done."


