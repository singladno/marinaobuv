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

# 1) Git: ensure HTTPS remote, stash local changes and pull latest main
if [ -d .git ]; then
  # Switch to HTTPS remote if SSH is configured (avoids ssh key issues on servers)
  if git remote -v | grep -q "git@github.com:"; then
    log "Switching git remote to HTTPS"
    git remote set-url origin https://github.com/singladno/marinaobuv.git || true
  fi
  if ! git diff --quiet || ! git diff --cached --quiet; then
    log "Stashing local changes before pull"
    git stash push -u -m auto-stash-on-boot || true
  fi
  log "Pulling latest from origin/main"
  git pull --rebase || true
fi

# 2) Install production deps (idempotent), disable husky/prepare scripts in prod
log "Installing production dependencies in web/ (HUSKY=0, --ignore-scripts)"
cd web
if [ -f package-lock.json ]; then
  HUSKY=0 npm ci --omit=dev --ignore-scripts --no-audit --no-fund || HUSKY=0 npm install --omit=dev --ignore-scripts --no-audit --no-fund
else
  HUSKY=0 npm install --omit=dev --ignore-scripts --no-audit --no-fund
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
pm2 save || true

# 4) Nginx: ensure proxy to localhost:3000 if conf exists
if [ -f /etc/nginx/conf.d/marinaobuv.conf ]; then
  if grep -q "proxy_pass http://web:3000;" /etc/nginx/conf.d/marinaobuv.conf; then
    log "Rewriting nginx upstream to 127.0.0.1:3000"
    sudo sed -i 's|proxy_pass http://web:3000;|proxy_pass http://127.0.0.1:3000;|g' /etc/nginx/conf.d/marinaobuv.conf || true
  fi
  sudo nginx -t && sudo systemctl restart nginx || true
fi

# 5) Install/refresh cron jobs
if [ -f scripts/install-crons.sh ]; then
  log "Installing/updating cron jobs"
  bash scripts/install-crons.sh || true
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

# 7) Health checks
log "Checking app on localhost:3000"
curl -s -I http://127.0.0.1:3000 | head -n1 || true
log "Checking nginx /health"
curl -s -I http://127.0.0.1/health | head -n1 || curl -s -I http://127.0.0.1 | head -n1 || true

log "Boot recovery script completed"

# 8) Ensure this script runs on every reboot (idempotent systemd unit)
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


