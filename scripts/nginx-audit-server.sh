#!/bin/bash
# Run on the production server (SSH) to find broken proxy_pass and duplicate HTTPS vhosts.
# Symptom in error.log: upstream: "http://localhost/..." (no :3000 or :3001) → 502 / no live upstreams

set -e

echo "=== nginx -t (duplicate server_name warnings?) ==="
sudo nginx -t 2>&1 || true

echo ""
echo "=== CRITICAL: proxy_pass to localhost WITHOUT port (proxies to :80, not Node) ==="
sudo grep -rE 'proxy_pass\s+http://localhost[";/[:space:]]' /etc/nginx/ 2>/dev/null \
  | grep -v '.backup.' || echo "(none found — good)"

echo ""
echo "=== proxy_pass lines in active marinaobuv HTTPS vhosts ==="
for f in /etc/nginx/conf.d/marinaobuv-https.conf /etc/nginx/sites-enabled/marinaobuv-https; do
  if [ -f "$f" ]; then
    echo "--- $f ---"
    sudo grep -n proxy_pass "$f" || true
  fi
done

echo ""
echo "=== Tips ==="
echo "1) Only ONE of conf.d/marinaobuv-https.conf OR sites-enabled/marinaobuv-https should define"
echo "   listen 443 for marina-obuv.ru — or nginx ignores the duplicate (see warning)."
echo "2) Every proxy_pass must use http://127.0.0.1:3000 or :3001 (matching pm2 list)."
echo "3) curl http://127.0.0.1:3001/api/health should be 200 for the active color."
