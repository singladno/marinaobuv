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
echo "2) Every proxy_pass must use http://127.0.0.1:<port> (never http://localhost/ without port)."
echo "3) Health: curl -sf http://127.0.0.1:3000/api/health (single-port deploy). Blue/green: curl the"
echo "   active port from switch_nginx_traffic / grep proxy_pass in conf.d/marinaobuv-https.conf."
echo "   Port 3001 is often the inactive color or groq-proxy — do not assume it serves Next /api/health."
