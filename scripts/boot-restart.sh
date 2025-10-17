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

# 3) PM2: run single instance and disable prisma-studio
log "Reloading PM2 with ecosystem.config.js"
pm2 startOrReload ecosystem.config.js --env production --update-env || pm2 start ecosystem.config.js --env production

# Scale to exactly 1 instance to avoid overload and delete studio if exists
pm2 scale marinaobuv 1 || true
pm2 delete prisma-studio || true

# Ensure groq-proxy is running (CRITICAL)
if ! pm2 list | grep -q "groq-proxy.*online"; then
  log "Installing proxy dependencies..."
  if ! cd proxy && npm install; then
    log "ERROR: Failed to install proxy dependencies - boot recovery cannot succeed"
    exit 1
  fi
  cd ..
  
  log "Starting groq-proxy server..."
  if ! pm2 start ecosystem.config.js --only groq-proxy --env production; then
    log "ERROR: Failed to start groq-proxy server - boot recovery cannot succeed"
    exit 1
  fi
  log "Groq proxy server started successfully"
fi

# Verify groq-proxy is responding (CRITICAL)
log "Verifying groq-proxy health..."
if ! curl -f -s http://localhost:8888/healthz > /dev/null 2>&1; then
  log "ERROR: Groq proxy is not responding to health checks - boot recovery cannot succeed"
  exit 1
fi
log "Groq proxy health check passed"

pm2 save || true

# 4) Nginx: ensure proxy to localhost:3000
NGINX_CONF="/etc/nginx/conf.d/marinaobuv.conf"
if [ -f "$NGINX_CONF" ]; then
  if grep -q "proxy_pass http://web:3000;" "$NGINX_CONF"; then
    log "Rewriting nginx upstream to 127.0.0.1:3000"
    sudo sed -i 's|proxy_pass http://web:3000;|proxy_pass http://127.0.0.1:3000;|g' "$NGINX_CONF" || true
  fi
else
  log "Writing nginx site config at $NGINX_CONF"
  sudo tee "$NGINX_CONF" >/dev/null <<'EOF'
server {
    listen 80;
    server_name marina-obuv.ru www.marina-obuv.ru;

    location /health {
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi
sudo nginx -t && sudo systemctl restart nginx || true

# 5) Install/refresh cron jobs (includes proxy monitoring)
if [ -f scripts/install-crons.sh ]; then
  log "Installing/updating cron jobs (including proxy monitoring)"
  bash scripts/install-crons.sh || true
fi

# 5.1) Install proxy monitoring systemd service
if [ -f scripts/auto-restart-proxy.sh ]; then
  log "Setting up proxy monitoring systemd service"
  chmod +x scripts/auto-restart-proxy.sh || true
  
  # Create systemd service for proxy monitoring
  sudo tee /etc/systemd/system/groq-proxy-monitor.service > /dev/null << 'EOF' || true
[Unit]
Description=Groq Proxy Server Monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/marinaobuv
ExecStart=/bin/bash /var/www/marinaobuv/scripts/auto-restart-proxy.sh
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  # Create systemd timer for periodic checks
  sudo tee /etc/systemd/system/groq-proxy-monitor.timer > /dev/null << 'EOF' || true
[Unit]
Description=Run Groq Proxy Monitor every 2 minutes
Requires=groq-proxy-monitor.service

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
Persistent=true

[Install]
WantedBy=timers.target
EOF

  # Enable and start the timer service
  sudo systemctl daemon-reload || true
  sudo systemctl enable groq-proxy-monitor.timer || true
  sudo systemctl start groq-proxy-monitor.timer || true
  log "Proxy monitoring systemd service installed and started"
fi

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
log "Ensuring Groq proxy port 8888 is open in firewall..."
sudo ufw allow 8888/tcp || true

# 7) Health checks
log "Checking app on localhost:3000"
curl -s -I http://127.0.0.1:3000 | head -n1 || true
log "Checking nginx /health"
curl -s -I http://127.0.0.1/health | head -n1 || curl -s -I http://127.0.0.1 | head -n1 || true
log "Checking groq-proxy on localhost:8787"
curl -s -I http://127.0.0.1:8787/healthz | head -n1 || true

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

# 9) Ensure this script runs on every reboot (idempotent systemd unit)
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
  sudo systemctl daemon-reload || true
  sudo systemctl enable marinaobuv-boot.service || true
fi

log "Systemd unit installed/enabled. Done."


