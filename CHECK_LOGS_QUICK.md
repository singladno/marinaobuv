# Quick Log Checking Guide

## After Logging In - Run These Commands

### 1. Check OOM (Out of Memory) Errors
```bash
sudo dmesg | grep -i "out of memory" | tail -20
```

### 2. Check System Logs
```bash
# Recent system errors
sudo journalctl -xe --since "1 hour ago" | tail -50

# All errors
sudo journalctl -p err -n 50

# Specific service logs
sudo journalctl -u marinaobuv-startup.service -n 50
sudo journalctl -u openvpn@client.service -n 50
```

### 3. Check Authentication Logs
```bash
# Recent login attempts
sudo tail -50 /var/log/auth.log

# Failed logins
sudo grep -i "failed\|invalid" /var/log/auth.log | tail -20

# All logins
sudo last -20
```

### 4. Check Application Logs
```bash
# PM2 logs
pm2 logs --lines 50

# Application logs
tail -50 /var/www/marinaobuv/web/logs/*.log

# Nginx logs
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log
```

### 5. Check for Malicious Activity
```bash
# Check for xmrig processes
ps aux | grep xmrig

# Check suspicious network connections
sudo netstat -tulpn | grep -v "127.0.0.1"

# Check cron jobs
crontab -l
sudo crontab -l -u root
```

### 6. Run Full Security Audit
```bash
cd /var/www/marinaobuv
bash scripts/security-audit.sh
```

---

## Quick One-Liner to Check Everything

```bash
echo "=== OOM Events ===" && sudo dmesg | grep -i "out of memory" | tail -5 && \
echo "" && echo "=== Failed Services ===" && sudo systemctl --failed && \
echo "" && echo "=== Recent Errors ===" && sudo journalctl -p err -n 10 --no-pager && \
echo "" && echo "=== Memory Usage ===" && free -h && \
echo "" && echo "=== Top Processes ===" && ps aux --sort=-%mem | head -10
```
