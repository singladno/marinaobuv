#!/usr/bin/env bash
# Run on the server after 502 / upstream incidents. Read-only except optional curl.
set -euo pipefail

echo "=== Time ==="
date -u || true
timedatectl 2>/dev/null || true

echo ""
echo "=== Listening ports (Next / Groq proxy) ==="
ss -lntp 2>/dev/null | grep -E ':3000|:3001' || true

echo ""
echo "=== PM2 (if installed) ==="
pm2 list 2>/dev/null || echo "(pm2 not found)"

echo ""
echo "=== Kernel OOM (last 200 lines) ==="
sudo dmesg 2>/dev/null | grep -i -E 'oom|out of memory' | tail -n 20 || true
sudo journalctl -k -n 50 --no-pager 2>/dev/null | grep -i oom || true

echo ""
echo "=== Nginx upstream errors (last 30) ==="
sudo tail -n 30 /var/log/nginx/error.log 2>/dev/null || true

echo ""
echo "=== Health checks (adjust port if blue/green) ==="
curl -sfS -m 3 http://127.0.0.1:3000/api/health && echo " OK :3000" || echo " FAIL :3000"
curl -sfS -m 3 http://127.0.0.1:3001/api/health 2>/dev/null && echo " OK :3001 /api/health" || echo " (no Next on :3001 or expected)"

echo ""
echo "=== Cron: parser job present? ==="
crontab -l 2>/dev/null | grep -E 'groq-sequential|JOB:parser' || true

echo ""
echo "Done."
