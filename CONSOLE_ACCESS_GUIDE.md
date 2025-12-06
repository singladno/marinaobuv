# Server Console Access Guide

## Server Information
- **IP Address**: 130.193.56.134
- **Domain**: marina-obuv.ru
- **OS**: Ubuntu (based on cloud-init config)
- **SSH User**: ubuntu

## Current Status
✅ Server is online and responding to GitHub Actions deployments
⚠️ Local SSH connection timing out (likely firewall/network issue)

---

## Console Access Instructions by Provider

### 1. Yandex Cloud Console Access

If your server is on Yandex Cloud:

1. **Login to Yandex Cloud Console**
   - Go to: https://console.cloud.yandex.ru
   - Sign in with your Yandex account

2. **Navigate to Compute Cloud**
   - Click on "Compute Cloud" → "Virtual machines"
   - Find your VM with IP `130.193.56.134`

3. **Access VNC Console**
   - Click on your VM instance
   - Click the "Connect" button (or "Подключиться" in Russian)
   - Select "VNC" or "Console" option
   - You'll get a web-based terminal access

4. **Alternative: Serial Console**
   - In VM settings, enable "Serial console"
   - Access via: VM → "Serial console" tab

**Direct Link Format:**
```
https://console.cloud.yandex.ru/folders/{FOLDER_ID}/compute/instances/{INSTANCE_ID}
```

---

### 2. ServerSpace Console Access

If your server is on ServerSpace:

1. **Login to ServerSpace Panel**
   - Go to: https://panel.serverspace.ru (or your ServerSpace portal)
   - Sign in with your account

2. **Access VPS Management**
   - Navigate to "VPS" or "Virtual Servers"
   - Find server with IP `130.193.56.134`

3. **Open Console**
   - Click on your server
   - Look for "Console" or "VNC Console" button
   - Click to open web-based terminal

4. **Alternative: KVM Console**
   - Some ServerSpace plans offer KVM console
   - Check server management panel for "KVM" option

---

### 3. Other Cloud Providers

#### Hetzner Cloud
1. Go to: https://console.hetzner.cloud
2. Select your project → Servers
3. Click on your server → "Console" tab
4. Use web-based console or download VNC credentials

#### DigitalOcean
1. Go to: https://cloud.digitalocean.com
2. Droplets → Select your droplet
3. Click "Access" → "Launch Console"
4. Web-based console will open

#### AWS EC2
1. Go to: https://console.aws.amazon.com/ec2
2. Instances → Select your instance
3. Click "Connect" → "EC2 Instance Connect" or "Session Manager"
4. Or use "EC2 Serial Console" if enabled

#### Google Cloud Platform
1. Go to: https://console.cloud.google.com
2. Compute Engine → VM instances
3. Click on your VM → "SSH" button (opens browser-based SSH)
4. Or use "Serial console" from VM details

---

## What to Check Once You Have Console Access

### 1. System Resources
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
# or
htop

# Check system load
uptime
```

### 2. SSH Service Status
```bash
# Check SSH daemon status
sudo systemctl status ssh
# or
sudo systemctl status sshd

# Check SSH configuration
sudo cat /etc/ssh/sshd_config | grep -E "(Port|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)"

# Check SSH logs
sudo journalctl -u ssh -n 50
# or
sudo tail -50 /var/log/auth.log
```

### 3. Network and Firewall
```bash
# Check firewall status
sudo ufw status verbose

# Check iptables rules
sudo iptables -L -n -v

# Check listening ports
sudo ss -tlnp
# or
sudo netstat -tlnp

# Check network connections
sudo ss -tnp
```

### 4. Application Status
```bash
# Check PM2 processes
pm2 list
pm2 status

# Check PM2 logs
pm2 logs --lines 50

# Check Nginx status
sudo systemctl status nginx

# Check if app is listening on port 3000
sudo ss -tlnp | grep 3000
# or
sudo lsof -i :3000
```

### 5. System Logs
```bash
# Recent system logs
sudo journalctl -xe --since "1 hour ago"

# System log
sudo tail -100 /var/log/syslog

# Authentication logs
sudo tail -50 /var/log/auth.log
```

---

## Troubleshooting SSH Connection Issues

### If SSH is timing out locally but works from GitHub Actions:

1. **Check if your IP is blocked**
   ```bash
   # On server (via console)
   sudo tail -100 /var/log/auth.log | grep "Failed\|refused\|blocked"
   ```

2. **Check firewall rules**
   ```bash
   # On server (via console)
   sudo ufw status numbered
   sudo iptables -L -n -v
   ```

3. **Try from different network**
   - Use mobile hotspot
   - Use VPN
   - Try from different location

4. **Check SSH daemon configuration**
   ```bash
   # On server (via console)
   sudo sshd -T | grep -E "(maxstartups|maxsessions|clientalive)"
   ```

5. **Restart SSH service** (if needed)
   ```bash
   # On server (via console)
   sudo systemctl restart ssh
   # or
   sudo systemctl restart sshd
   ```

---

## Quick Diagnostic Commands (Run via Console)

```bash
# Full system status check
echo "=== System Info ==="
uname -a
uptime
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== CPU Load ==="
top -bn1 | head -5
echo ""
echo "=== Running Services ==="
systemctl list-units --type=service --state=running | grep -E "(ssh|nginx|postgres|pm2)"
echo ""
echo "=== PM2 Status ==="
pm2 list
echo ""
echo "=== Port 3000 Status ==="
sudo ss -tlnp | grep 3000 || echo "Port 3000 not listening"
echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager | head -10
echo ""
echo "=== Recent Errors ==="
sudo journalctl -p err -n 20 --no-pager
```

---

## Alternative: Use GitHub Actions to Run Commands

Since SSH works from GitHub Actions, you can temporarily add diagnostic steps to your workflow:

1. Go to your repository → Actions
2. Edit the workflow file (`.github/workflows/deploy-pm2.yml`)
3. Add a new step before deployment to run diagnostics
4. Commit and push to trigger the workflow
5. Check the workflow logs for output

---

## Contact Information

If you need help identifying your cloud provider:
- Check your email for cloud provider invoices/notifications
- Check your credit card statements for cloud provider charges
- Look for cloud provider account emails in your inbox

Common providers for Russian IPs:
- Yandex Cloud (most likely based on S3 config)
- ServerSpace
- Selectel
- Timeweb Cloud

---

## Security Note

⚠️ **Important**: When accessing via console, you'll have full system access. Be careful with commands, especially those using `sudo` or modifying system configurations.
