# Console Login Instructions

## Current Situation
⚠️ **CRITICAL SECURITY ALERT**: Your server shows `xmrig` processes (cryptocurrency miner) which indicates the server has been compromised.

## Login Steps

### 1. At the Console Login Prompt

You should see:
```
marinaobuv-server login:
```

### 2. Enter Username
Type: `ubuntu` and press Enter

### 3. Enter Password
- If you set a password during setup, enter it
- If no password was set, you may need to:
  - Use cloud provider console password reset
  - Or use SSH key authentication if console supports it

### 4. Alternative: Password Reset via Cloud Provider

**Yandex Cloud:**
1. Go to console → Compute Cloud → Your VM
2. Click "Stop" → Wait for shutdown
3. Click "..." menu → "Reset password"
4. Set new password for user `ubuntu`
5. Start VM and login with new password

**ServerSpace:**
1. Go to panel → VPS → Your server
2. Click "Reset password" or "Change root password"
3. Set new password
4. Login with new password

---

## Once Logged In - Immediate Actions

### Step 1: Check System Status
```bash
# Check if you're logged in as root or ubuntu
whoami

# Check system resources
free -h
df -h
top
```

### Step 2: Check for Malicious Processes
```bash
# Check running processes
ps aux | grep -E "(xmrig|miner|crypto)" | grep -v grep

# Check all processes by user
ps aux | sort -k3 -r | head -20

# Check network connections
sudo netstat -tulpn | grep -E "(xmrig|suspicious)"
```

### Step 3: Check System Logs
```bash
# Check OOM killer logs
sudo dmesg | grep -i "out of memory" | tail -20

# Check systemd logs for failed services
sudo journalctl -xe --since "1 hour ago" | tail -50

# Check auth logs for unauthorized access
sudo tail -100 /var/log/auth.log | grep -E "(Failed|Accepted|Invalid)"

# Check recent login attempts
sudo last -20
sudo lastlog | grep -v "Never"
```

### Step 4: Check for Intrusion Indicators
```bash
# Check cron jobs (attackers often add malicious crontabs)
sudo crontab -l
sudo crontab -l -u root
sudo ls -la /etc/cron.d/
sudo ls -la /var/spool/cron/crontabs/

# Check for suspicious files
sudo find /tmp -type f -name "*xmrig*" 2>/dev/null
sudo find /var/tmp -type f -name "*xmrig*" 2>/dev/null
sudo find /home -type f -name "*xmrig*" 2>/dev/null

# Check for unauthorized SSH keys
cat ~/.ssh/authorized_keys
sudo cat /root/.ssh/authorized_keys
```

---

## Critical Security Commands

### Kill Malicious Processes
```bash
# Find and kill xmrig processes
sudo pkill -9 xmrig
sudo killall -9 xmrig

# Check if they're still running
ps aux | grep xmrig | grep -v grep
```

### Check What's Consuming Memory
```bash
# Top memory consumers
ps aux --sort=-%mem | head -20

# Check swap usage
free -h
swapon --show
```

### Check Failed Services
```bash
# Check why services failed to start
sudo systemctl status marinaobuv-startup.service
sudo systemctl status openvpn@client.service

# View service logs
sudo journalctl -u marinaobuv-startup.service -n 50
sudo journalctl -u openvpn@client.service -n 50
```

---

## Full Diagnostic Script

Run this comprehensive check:

```bash
#!/bin/bash
echo "=== SECURITY AUDIT ==="
echo ""
echo "1. Running Processes:"
ps aux | grep -E "(xmrig|miner|suspicious)" | grep -v grep
echo ""
echo "2. Memory Usage:"
free -h
echo ""
echo "3. Disk Usage:"
df -h
echo ""
echo "4. Network Connections:"
sudo netstat -tulpn | head -20
echo ""
echo "5. Recent Logins:"
sudo last -10
echo ""
echo "6. Cron Jobs:"
sudo crontab -l
echo ""
echo "7. System Errors:"
sudo dmesg | tail -30
echo ""
echo "8. Failed Services:"
sudo systemctl --failed
echo ""
echo "9. OOM Killer History:"
sudo dmesg | grep -i "out of memory" | tail -10
```

---

## Next Steps After Investigation

1. **Document everything** - Take screenshots/save logs
2. **Kill malicious processes** - Stop the miner
3. **Block unauthorized access** - Change passwords, review SSH keys
4. **Clean up** - Remove malicious files and cron jobs
5. **Harden security** - Update system, review firewall rules
6. **Restore services** - Restart legitimate services

---

## If You Can't Login

If password doesn't work:

1. **Use cloud provider console password reset**
2. **Boot into recovery mode** (if available in cloud console)
3. **Use cloud provider's "Reset password" feature**
4. **Contact cloud provider support** for console access assistance

---

## Emergency Recovery

If system is completely unresponsive:

1. **Reboot via cloud console** (if available)
2. **Stop VM → Create snapshot → Start VM**
3. **Access via recovery console** (if provider offers it)
4. **Consider restoring from backup** if system is too compromised
