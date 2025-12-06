# Security Hardening Guide - Prevent Future Breaches

## 🔴 Critical Security Measures (Do First)

### 1. **Install and Configure Fail2Ban**

Fail2Ban automatically bans IPs that show malicious activity (brute force, etc.)

```bash
# Install Fail2Ban
sudo apt update
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

**Key settings to configure:**

```ini
[DEFAULT]
# Ban time in seconds (1 hour = 3600)
bantime = 3600
# Time window to count failures (10 minutes = 600)
findtime = 600
# Max failures before ban
maxretry = 3

[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
findtime = 600
```

```bash
# Start and enable Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban

# Check banned IPs
sudo fail2ban-client status sshd
```

### 2. **Harden SSH Configuration**

```bash
# Backup current config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

**Add/update these settings:**

```bash
# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no
PubkeyAuthentication yes

# Limit authentication attempts
MaxAuthTries 3
MaxStartups 3:50:10

# Disable empty passwords
PermitEmptyPasswords no

# Use only strong ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Disable X11 forwarding
X11Forwarding no

# Set idle timeout (5 minutes)
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable unused features
UsePAM no
AllowTcpForwarding no
```

```bash
# Test SSH config before applying
sudo sshd -t

# If test passes, restart SSH
sudo systemctl restart ssh
```

### 3. **Configure Firewall (UFW)**

```bash
# Reset UFW to defaults
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow application port (if needed)
sudo ufw allow 3000/tcp comment 'App' || true

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose

# Block specific attacking IPs
sudo ufw deny from 159.223.2.190
sudo ufw deny from 161.35.146.183
```

### 4. **Change All Passwords**

```bash
# Change user password
passwd

# If you have other users
sudo passwd <username>

# Check for users with no password (security risk)
sudo awk -F: '($2 == "") {print $1}' /etc/shadow
```

### 5. **Review and Secure SSH Keys**

```bash
# Check authorized keys
cat ~/.ssh/authorized_keys
sudo cat /root/.ssh/authorized_keys 2>/dev/null

# Remove any unknown keys
nano ~/.ssh/authorized_keys

# Set proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_* 2>/dev/null || true
```

---

## 🛡️ System Hardening

### 6. **Update System Regularly**

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Remove unused packages
sudo apt autoremove -y

# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 7. **Disable Unused Services**

```bash
# List all enabled services
systemctl list-unit-files --type=service --state=enabled

# Disable services you don't need
sudo systemctl disable <service-name>
sudo systemctl stop <service-name>

# Check for listening ports
sudo ss -tlnp
# Disable services listening on ports you don't need
```

### 8. **Set Up Log Monitoring**

```bash
# Install logwatch or similar
sudo apt install -y logwatch

# Or set up custom log monitoring script
# (See monitoring section below)
```

### 9. **Configure Automatic Backups**

```bash
# Your backup cron job should already be set up
# Verify it's working:
crontab -l | grep backup

# Test backup
cd /var/www/marinaobuv/web
export $(grep -v '^#' .env | xargs)
npx tsx scripts/backup-database.ts
```

---

## 🔍 Monitoring and Alerting

### 10. **Set Up Security Monitoring Script**

Create a script to monitor for suspicious activity:

```bash
# Create monitoring script
sudo tee /usr/local/bin/security-monitor.sh > /dev/null <<'EOF'
#!/bin/bash
# Security monitoring script - run via cron

LOG_FILE="/var/log/security-monitor.log"
ALERT_EMAIL="your-email@example.com"  # Change this

log_alert() {
    echo "[$(date)] ALERT: $1" | tee -a "$LOG_FILE"
    # Uncomment to send email alerts
    # echo "$1" | mail -s "Security Alert" "$ALERT_EMAIL"
}

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l)
if [ "$FAILED_LOGINS" -gt 10 ]; then
    log_alert "High number of failed login attempts: $FAILED_LOGINS"
fi

# Check for new users
NEW_USERS=$(lastlog | grep -v "Never" | awk '{print $1}' | sort -u)
# Compare with known users list

# Check for suspicious processes
SUSPICIOUS=$(ps aux | grep -E "(xmrig|miner|crypto|nc -l|python.*socket)" | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    log_alert "Suspicious processes detected: $SUSPICIOUS"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log_alert "Disk usage critical: ${DISK_USAGE}%"
fi

# Check for unauthorized cron jobs
CRON_CHANGES=$(find /var/spool/cron /etc/cron.d -type f -mtime -1 2>/dev/null)
if [ -n "$CRON_CHANGES" ]; then
    log_alert "Recent cron job changes detected"
fi
EOF

sudo chmod +x /usr/local/bin/security-monitor.sh

# Add to cron (run every hour)
(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/security-monitor.sh") | crontab -
```

### 11. **Monitor System Resources**

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up resource alerts
# (Add to security-monitor.sh)
```

---

## 🔐 Application Security

### 12. **Secure Environment Variables**

```bash
# Ensure .env files have proper permissions
chmod 600 /var/www/marinaobuv/web/.env
chmod 600 /var/www/marinaobuv/.env 2>/dev/null || true

# Never commit .env files to git
# Verify .gitignore includes .env
grep -q "\.env" /var/www/marinaobuv/.gitignore || echo ".env" >> /var/www/marinaobuv/.gitignore
```

### 13. **Regular Security Audits**

```bash
# Run security audit script regularly
cd /var/www/marinaobuv
bash scripts/security-audit.sh

# Add to cron (weekly)
(crontab -l 2>/dev/null; echo "0 2 * * 0 cd /var/www/marinaobuv && bash scripts/security-audit.sh >> /var/log/security-audit.log 2>&1") | crontab -
```

### 14. **Keep Dependencies Updated**

```bash
# Check for outdated npm packages
cd /var/www/marinaobuv/web
npm outdated

# Check for security vulnerabilities
npm audit

# Update packages regularly
npm update
```

---

## 🌐 Network Security

### 15. **Use Cloud Provider Security Groups**

If using Yandex Cloud or similar:

- Configure security groups to only allow necessary ports
- Restrict SSH access to your IP only
- Use private networks where possible

### 16. **Consider VPN for Admin Access**

Instead of exposing SSH to the internet:

- Set up a VPN (WireGuard is lightweight)
- Only allow SSH from VPN IP range
- Or use cloud provider's console access

### 17. **Rate Limiting**

```bash
# Install and configure rate limiting for web server
# Add to nginx config:
# limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
# limit_req zone=login burst=3 nodelay;
```

---

## 📋 Regular Maintenance Checklist

### Daily

- [ ] Check system logs for errors
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Review failed login attempts

### Weekly

- [ ] Run security audit script
- [ ] Review Fail2Ban banned IPs
- [ ] Check for system updates
- [ ] Review application logs

### Monthly

- [ ] Update all packages
- [ ] Review and rotate SSH keys
- [ ] Review user accounts
- [ ] Test backup restoration
- [ ] Review firewall rules

### Quarterly

- [ ] Full security audit
- [ ] Review and update security policies
- [ ] Penetration testing (if possible)
- [ ] Review access logs

---

## 🚨 Incident Response Plan

If you detect a breach:

1. **Immediately disconnect** (if safe to do so)
2. **Document everything** - Take screenshots, save logs
3. **Kill malicious processes**
4. **Change all passwords**
5. **Review and clean SSH keys**
6. **Check for backdoors** (cron jobs, systemd services, etc.)
7. **Review system logs** for how they got in
8. **Patch the vulnerability**
9. **Restore from clean backup** if needed
10. **Notify relevant parties**

---

## 🔧 Quick Security Hardening Script

See `scripts/harden-security.sh` for an automated script that applies most of these measures.

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## ⚠️ Important Notes

1. **Test changes in staging first** - Some security changes can lock you out
2. **Keep SSH access** - Always ensure you can access the server before making changes
3. **Backup before changes** - Always backup before major security changes
4. **Monitor after changes** - Watch logs after implementing security measures
5. **Document everything** - Keep notes on what security measures are in place

---

## 🎯 Priority Order

1. **Fail2Ban** - Stop brute force attacks immediately
2. **SSH Hardening** - Secure your primary access method
3. **Firewall** - Block unnecessary ports
4. **System Updates** - Patch known vulnerabilities
5. **Monitoring** - Detect future attacks early
6. **Regular Audits** - Find issues before attackers do
