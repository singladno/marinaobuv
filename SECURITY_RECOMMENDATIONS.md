# Security Recommendations Based on Audit Results

## 🔴 CRITICAL ISSUES FOUND

### 1. **Cryptocurrency Miner Service Detected**
```
● c3pool_miner.service    loaded failed failed Monero miner service
```

**Action Required:**
```bash
# Disable and remove the miner service
sudo systemctl stop c3pool_miner.service
sudo systemctl disable c3pool_miner.service
sudo systemctl mask c3pool_miner.service
sudo rm /etc/systemd/system/c3pool_miner.service
sudo systemctl daemon-reload

# Search for miner files
sudo find / -name "*c3pool*" -o -name "*miner*" 2>/dev/null
sudo find /tmp /var/tmp /home -type f -executable -name "*miner*" 2>/dev/null
```

---

## ⚠️ FAILED SERVICES TO FIX

### 1. **marinaobuv-startup.service** - Application Startup Failing
```
Process: 2867 ExecStart=/var/www/marinaobuv/scripts/auto-startup.sh (code=exited, status=203/EXEC)
```

**Status 203/EXEC** means the script file doesn't exist or isn't executable.

**Fix:**
```bash
# Check if script exists
ls -la /var/www/marinaobuv/scripts/auto-startup.sh

# If missing, check what startup script should be used
ls -la /var/www/marinaobuv/scripts/*startup*
ls -la /var/www/marinaobuv/scripts/*boot*

# Make executable if it exists
sudo chmod +x /var/www/marinaobuv/scripts/auto-startup.sh

# Or fix the service file
sudo nano /etc/systemd/system/marinaobuv-startup.service
# Update ExecStart path to correct script

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart marinaobuv-startup.service
```

### 2. **openvpn@client.service** - VPN Failing
```
Cannot pre-load keyfile (ta.key)
```

**Fix:**
```bash
# Check if OpenVPN config exists
ls -la /etc/openvpn/client.conf

# Check for ta.key file
ls -la /etc/openvpn/ta.key

# If missing, either:
# Option A: Disable if not needed
sudo systemctl disable openvpn@client.service
sudo systemctl stop openvpn@client.service

# Option B: Recreate ta.key if VPN is needed
# (You'll need your OpenVPN server config)
```

### 3. **pm2-marinaobuv.service** - PM2 Service Failing

**Fix:**
```bash
# Check PM2 status
pm2 list

# Check if PM2 is running
which pm2
pm2 --version

# Restart PM2 processes manually
cd /var/www/marinaobuv
pm2 start ecosystem.config.js --env production
pm2 save

# Or fix the systemd service
sudo systemctl status pm2-marinaobuv.service -l
# Check the service file and fix path issues
```

---

## 🛡️ SECURITY HARDENING

### 1. **Protect Against Brute Force Attacks**

You have ongoing brute force attempts:
```
Invalid user mysql from 159.223.2.190
Invalid user es from 161.35.146.183
```

**Install and Configure Fail2Ban:**
```bash
# Install fail2ban
sudo apt update
sudo apt install -y fail2ban

# Configure SSH protection
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add/update SSH section:
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
findtime = 600

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
```

**Or use UFW to block specific IPs:**
```bash
# Block the attacking IPs
sudo ufw deny from 159.223.2.190
sudo ufw deny from 161.35.146.183
```

### 2. **Harden SSH Configuration**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/update these settings:
PermitRootLogin no
PasswordAuthentication no  # Already set, verify
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart ssh
```

### 3. **Change All Passwords**

```bash
# Change ubuntu user password
passwd

# If you have other users, change their passwords too
sudo passwd <username>
```

### 4. **Review and Clean SSH Keys**

Your authorized_keys look clean, but verify:
```bash
# Check for any suspicious keys
cat ~/.ssh/authorized_keys
# Should only contain your legitimate keys

# Remove any unknown keys
nano ~/.ssh/authorized_keys
# Remove any keys you don't recognize
```

---

## 🔧 SYSTEM MAINTENANCE

### 1. **Update System**

```bash
# 30 updates available - install them
sudo apt update
sudo apt list --upgradable
sudo apt upgrade -y
sudo apt autoremove -y
```

### 2. **Check Firewall Status**

```bash
# Check UFW status
sudo ufw status verbose

# If not enabled, configure it
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. **Monitor System Resources**

```bash
# Set up monitoring
# Check memory regularly
free -h

# Check disk space
df -h

# Monitor processes
htop
# or
top
```

---

## 🔍 DEEP CLEANUP - Remove All Miner Traces

```bash
# 1. Find all miner-related files
sudo find / -type f -name "*xmrig*" 2>/dev/null
sudo find / -type f -name "*c3pool*" 2>/dev/null
sudo find / -type f -name "*miner*" 2>/dev/null
sudo find / -type f -name "*monero*" 2>/dev/null

# 2. Check for miner processes in unusual locations
sudo find /tmp /var/tmp /dev/shm -type f -executable 2>/dev/null

# 3. Check for suspicious cron jobs
sudo crontab -l -u root
sudo crontab -l -u ubuntu
sudo ls -la /etc/cron.d/
sudo ls -la /var/spool/cron/crontabs/

# 4. Check for suspicious systemd services
sudo systemctl list-units --type=service --all | grep -i miner
sudo ls -la /etc/systemd/system/*miner*
sudo ls -la /etc/systemd/system/*c3pool*

# 5. Check network connections for mining pools
sudo netstat -tulpn | grep -E "(4444|3333|8080|14444)"  # Common miner ports
sudo ss -tulpn | grep -E "(4444|3333|8080|14444)"

# 6. Check for modified binaries
sudo find /usr/bin /usr/sbin /bin /sbin -type f -newer /etc/passwd 2>/dev/null
```

---

## ✅ RESTORE APPLICATION SERVICES

### 1. **Start PM2 Application**

```bash
cd /var/www/marinaobuv

# Check PM2 status
pm2 list

# If not running, start it
pm2 start ecosystem.config.js --env production
# or
pm2 startOrReload ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Check application health
curl http://localhost:3000/api/health
```

### 2. **Start Nginx**

```bash
# Check Nginx status
sudo systemctl status nginx

# If not running, start it
sudo systemctl start nginx
sudo systemctl enable nginx

# Test configuration
sudo nginx -t

# Reload if needed
sudo systemctl reload nginx
```

### 3. **Verify Application is Working**

```bash
# Check if app is responding
curl https://marina-obuv.ru/api/health

# Check PM2 logs
pm2 logs --lines 50

# Check Nginx logs
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log
```

---

## 📋 PRIORITY ACTION CHECKLIST

### Immediate (Do Now):
- [ ] Disable and remove `c3pool_miner.service`
- [ ] Search for and remove all miner files
- [ ] Install and configure Fail2Ban
- [ ] Block attacking IPs with UFW
- [ ] Change all passwords

### High Priority (Today):
- [ ] Fix `marinaobuv-startup.service`
- [ ] Fix or disable `openvpn@client.service`
- [ ] Fix `pm2-marinaobuv.service` or start PM2 manually
- [ ] Update system (30 updates available)
- [ ] Harden SSH configuration
- [ ] Verify firewall is properly configured

### Medium Priority (This Week):
- [ ] Deep cleanup - remove all miner traces
- [ ] Review all cron jobs
- [ ] Set up monitoring/alerts
- [ ] Review system logs regularly
- [ ] Test application functionality

### Ongoing:
- [ ] Monitor system resources
- [ ] Review security logs weekly
- [ ] Keep system updated
- [ ] Regular security audits

---

## 🚨 RED FLAGS TO INVESTIGATE

1. **How did the miner get installed?**
   - Check `/var/log/auth.log` for unauthorized access
   - Review recent file modifications: `sudo find /etc/systemd/system -type f -mtime -30`
   - Check when c3pool_miner.service was created: `sudo stat /etc/systemd/system/c3pool_miner.service`

2. **Check for backdoors:**
   ```bash
   # Check for reverse shells
   sudo netstat -tulpn | grep ESTABLISHED
   sudo ss -tulpn | grep ESTABLISHED

   # Check for suspicious scripts
   sudo find /home /root -name "*.sh" -mtime -30
   sudo find /tmp /var/tmp -name "*.sh" -mtime -7
   ```

3. **Review access logs:**
   ```bash
   # Check who accessed the system
   sudo last -50
   sudo lastlog

   # Check sudo usage
   sudo grep sudo /var/log/auth.log | tail -50
   ```

---

## 📞 IF YOU NEED HELP

If you're unsure about any commands or need assistance:
1. Review each command before running
2. Test in a safe environment first if possible
3. Backup important data before making changes
4. Document what you find

---

## 🎯 QUICK FIX SCRIPT

Run this to address the most critical issues:

```bash
#!/bin/bash
# Quick security fix script

echo "1. Removing miner service..."
sudo systemctl stop c3pool_miner.service 2>/dev/null
sudo systemctl disable c3pool_miner.service 2>/dev/null
sudo systemctl mask c3pool_miner.service 2>/dev/null
sudo rm -f /etc/systemd/system/c3pool_miner.service 2>/dev/null
sudo systemctl daemon-reload

echo "2. Blocking attacking IPs..."
sudo ufw deny from 159.223.2.190 2>/dev/null
sudo ufw deny from 161.35.146.183 2>/dev/null

echo "3. Installing Fail2Ban..."
sudo apt update && sudo apt install -y fail2ban

echo "4. Starting application services..."
cd /var/www/marinaobuv
pm2 startOrReload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
pm2 save

echo "5. Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo "Done! Review the output above for any errors."
```

Save as `quick-security-fix.sh`, make executable (`chmod +x quick-security-fix.sh`), and run it.
