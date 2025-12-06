# Server Recovery Plan - After Security Breach

## Current Situation
- Server IP: 130.193.56.134
- Server is unresponsive (likely compromised or overloaded)
- Previous security breach with miner detected

## Recovery Options

### Option 1: Complete Server Reset (RECOMMENDED)
**Best if:** You have backups and can afford downtime

1. **Backup Critical Data First** (if server becomes accessible):
   ```bash
   # Database backup
   pg_dump marinaobuv > backup-$(date +%Y%m%d).sql

   # Environment files
   cp /var/www/marinaobuv/web/.env ~/env-backup-$(date +%Y%m%d)

   # Important files
   tar -czf ~/marinaobuv-backup-$(date +%Y%m%d).tar.gz /var/www/marinaobuv/web/.env /var/www/marinaobuv/web/prisma
   ```

2. **Reset Server via Cloud Provider**:
   - **Yandex Cloud**: Go to Compute Cloud → VM Instances → Select instance → Stop → Create snapshot → Delete → Create new from snapshot (or fresh)
   - **Other providers**: Similar process - stop, snapshot, recreate

3. **Fresh Server Setup**:
   ```bash
   # Run on NEW server
   git clone https://github.com/singladno/marinaobuv.git /var/www/marinaobuv
   cd /var/www/marinaobuv
   bash setup-server.sh
   ```

### Option 2: Create New Server with Same IP (IF POSSIBLE)
**Best if:** Your provider supports IP reassignment

1. **Check with Provider**:
   - Yandex Cloud: Can reassign static IPs
   - AWS: Use Elastic IP
   - Other: Check provider documentation

2. **Steps**:
   - Create new VM instance
   - Assign the old IP (130.193.56.134) to new instance
   - Update DNS if needed
   - Deploy fresh application

### Option 3: Emergency Access (If Server Responds)
**If you can get SSH access briefly:**

1. **Kill All Suspicious Processes**:
   ```bash
   # Find and kill miners
   pkill -f miner
   pkill -f xmrig
   pkill -f cpuminer

   # Check for suspicious processes
   ps aux | grep -E "(miner|stratum|hash)" | grep -v grep
   ```

2. **Block Suspicious Network Connections**:
   ```bash
   # Check active connections
   netstat -tnp | grep ESTABLISHED

   # Block suspicious IPs
   sudo iptables -A INPUT -s <suspicious-ip> -j DROP
   ```

3. **Clean Up**:
   ```bash
   # Remove suspicious cron jobs
   crontab -l > /tmp/cron-backup
   crontab -r
   # Review and restore only legitimate jobs

   # Check for backdoors
   find /tmp /var/tmp -name "*.sh" -type f
   find /home -name ".*" -type f -size +1M
   ```

## Security Hardening for New Server

### 1. Initial Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Setup firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSH Hardening
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/change:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22  # Consider changing to non-standard port

# Restart SSH
sudo systemctl restart sshd
```

### 3. User Security
```bash
# Create non-root user (if not exists)
sudo adduser ubuntu
sudo usermod -aG sudo ubuntu

# Setup SSH keys (NO password auth)
# Copy your public key to ~/.ssh/authorized_keys
```

### 4. Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop netstat-nat -y

# Setup log monitoring
sudo apt install logwatch -y
```

### 5. Application Security
```bash
# Run security scan regularly
# Add to crontab:
0 2 * * * /var/www/marinaobuv/scripts/security-scan.sh >> /var/log/security-scan.log 2>&1
```

## Deployment Checklist

After setting up new server:

- [ ] Run `setup-server.sh`
- [ ] Restore database backup
- [ ] Restore `.env` file
- [ ] Deploy application: `./deploy-pm2.sh`
- [ ] Verify application is running
- [ ] Setup SSL certificate
- [ ] Configure monitoring
- [ ] Setup automated backups
- [ ] Review firewall rules
- [ ] Test security scan scripts

## Prevention Measures

1. **Regular Backups**: Automated daily backups
2. **Security Updates**: Weekly system updates
3. **Monitoring**: Set up alerts for high CPU/memory
4. **Access Control**: Use SSH keys only, no passwords
5. **Firewall**: Only open necessary ports
6. **Regular Scans**: Weekly security scans

## Emergency Contacts

- **Hosting Provider Support**: Contact them about IP reassignment
- **Database Backup Location**: Check if you have recent backups
- **DNS Provider**: May need to update DNS records if IP changes

## Next Steps

1. **Immediate**: Try to access server via cloud provider console
2. **If accessible**: Run security scan, backup data, then reset
3. **If not accessible**: Create new server, restore from backups
4. **Long-term**: Implement security hardening measures above
