# Security Checklist - Post-Breach Hardening

## ✅ Immediate Actions (Do Now)

- [ ] **Install Fail2Ban** - Stop brute force attacks
  ```bash
  sudo apt install -y fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

- [ ] **Harden SSH** - Disable root login, password auth
  ```bash
  sudo nano /etc/ssh/sshd_config
  # Set: PermitRootLogin no, PasswordAuthentication no
  sudo systemctl restart ssh
  ```

- [ ] **Configure Firewall** - Block unnecessary ports
  ```bash
  sudo ufw default deny incoming
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

- [ ] **Change All Passwords**
  ```bash
  passwd
  ```

- [ ] **Block Attacking IPs**
  ```bash
  sudo ufw deny from 159.223.2.190
  sudo ufw deny from 161.35.146.183
  ```

- [ ] **Review SSH Keys** - Remove unknown keys
  ```bash
  cat ~/.ssh/authorized_keys
  # Remove any keys you don't recognize
  ```

- [ ] **Run Security Hardening Script**
  ```bash
  cd /var/www/marinaobuv
  git pull
  bash scripts/harden-security.sh
  ```

## 🔒 Ongoing Security (This Week)

- [ ] **Update System**
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Set Up Automatic Security Updates**
  ```bash
  sudo apt install -y unattended-upgrades
  ```

- [ ] **Secure Environment Files**
  ```bash
  chmod 600 /var/www/marinaobuv/web/.env
  ```

- [ ] **Review Cron Jobs** - Check for backdoors
  ```bash
  crontab -l
  sudo crontab -l -u root
  ```

- [ ] **Review Systemd Services** - Remove unused ones
  ```bash
  systemctl list-unit-files --type=service --state=enabled
  ```

- [ ] **Set Up Security Monitoring**
  ```bash
  # Already done by harden-security.sh
  # Check logs: tail -f /var/log/security-monitor.log
  ```

## 📊 Regular Maintenance

### Daily
- [ ] Check system logs: `sudo journalctl -xe`
- [ ] Monitor resources: `htop`, `df -h`, `free -h`
- [ ] Check Fail2Ban: `sudo fail2ban-client status sshd`

### Weekly
- [ ] Run security audit: `bash scripts/security-audit.sh`
- [ ] Review failed logins: `sudo grep "Failed" /var/log/auth.log | tail -20`
- [ ] Check for updates: `sudo apt update && apt list --upgradable`

### Monthly
- [ ] Full system update: `sudo apt update && sudo apt upgrade -y`
- [ ] Review SSH keys: `cat ~/.ssh/authorized_keys`
- [ ] Test backups: Verify backup restoration works
- [ ] Review firewall rules: `sudo ufw status verbose`

## 🚨 Red Flags to Watch For

- [ ] Unusual CPU/memory usage
- [ ] Unknown processes running
- [ ] New systemd services
- [ ] Modified cron jobs
- [ ] Failed login attempts
- [ ] Unusual network connections
- [ ] Disk space filling up unexpectedly
- [ ] New SSH keys in authorized_keys

## 📝 Quick Security Commands

```bash
# Check for malicious processes
ps aux | grep -E "(xmrig|miner|crypto)"

# Check for suspicious services
systemctl list-units --all | grep -E "(miner|c3pool)"

# Check failed logins
sudo grep "Failed" /var/log/auth.log | tail -20

# Check Fail2Ban status
sudo fail2ban-client status sshd

# Check firewall
sudo ufw status verbose

# Check listening ports
sudo ss -tlnp

# Run security audit
cd /var/www/marinaobuv && bash scripts/security-audit.sh
```

## 🎯 Priority Order

1. **Fail2Ban** - Stop brute force (5 min)
2. **SSH Hardening** - Secure access (10 min)
3. **Firewall** - Block attacks (5 min)
4. **Change Passwords** - Prevent reuse (2 min)
5. **System Updates** - Patch vulnerabilities (15 min)
6. **Monitoring** - Detect future attacks (10 min)

## ⚠️ Important Notes

- **Test SSH access** after hardening - don't lock yourself out!
- **Keep console access** available in case SSH is affected
- **Backup before changes** - especially SSH config
- **Monitor after changes** - watch logs for issues
- **Document changes** - know what security measures are in place
