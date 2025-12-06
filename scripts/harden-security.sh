#!/bin/bash

# Comprehensive Security Hardening Script
# Run this to apply security best practices

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "Security Hardening Script"
echo "=========================================="
echo ""
log_warning "This script will make security changes to your system."
log_warning "Make sure you have console access in case SSH is affected."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Aborted by user"
    exit 1
fi

# 1. Install and Configure Fail2Ban
log_info "1. Installing and configuring Fail2Ban..."
if ! command -v fail2ban-client &> /dev/null; then
    sudo apt update -qq
    sudo apt install -y fail2ban
    log_success "Fail2Ban installed"
else
    log_success "Fail2Ban already installed"
fi

# Configure Fail2Ban
if [ ! -f /etc/fail2ban/jail.local ]; then
    sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
    log_success "Fail2Ban configuration created"
fi

# Update SSH jail settings
sudo sed -i 's/^\[sshd\]/\[sshd\]\nenabled = true\nmaxretry = 3\nbantime = 3600\nfindtime = 600/' /etc/fail2ban/jail.local 2>/dev/null || \
sudo bash -c 'cat >> /etc/fail2ban/jail.local << EOF

[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
findtime = 600
EOF'

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
log_success "Fail2Ban configured and started"
echo ""

# 2. Harden SSH Configuration
log_info "2. Hardening SSH configuration..."
SSH_CONFIG="/etc/ssh/sshd_config"
if [ -f "$SSH_CONFIG" ]; then
    # Backup
    sudo cp "$SSH_CONFIG" "${SSH_CONFIG}.backup.$(date +%Y%m%d)"

    # Apply security settings
    sudo sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' "$SSH_CONFIG"
    sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' "$SSH_CONFIG"

    sudo sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"
    sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"

    sudo sed -i 's/^#PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"
    sudo sed -i 's/^PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"

    # Add settings if not present
    grep -q "^MaxAuthTries" "$SSH_CONFIG" || echo "MaxAuthTries 3" | sudo tee -a "$SSH_CONFIG"
    grep -q "^ClientAliveInterval" "$SSH_CONFIG" || echo "ClientAliveInterval 300" | sudo tee -a "$SSH_CONFIG"
    grep -q "^ClientAliveCountMax" "$SSH_CONFIG" || echo "ClientAliveCountMax 2" | sudo tee -a "$SSH_CONFIG"

    # Test SSH config
    if sudo sshd -t; then
        log_success "SSH configuration is valid"
        sudo systemctl restart ssh
        log_success "SSH restarted with new configuration"
    else
        log_error "SSH configuration test failed - reverting"
        sudo cp "${SSH_CONFIG}.backup.$(date +%Y%m%d)" "$SSH_CONFIG"
        log_warning "SSH config reverted to backup"
    fi
else
    log_warning "SSH config file not found"
fi
echo ""

# 3. Configure Firewall
log_info "3. Configuring firewall..."
if command -v ufw &> /dev/null; then
    # Set defaults
    echo "y" | sudo ufw --force reset 2>/dev/null || true
    sudo ufw default deny incoming
    sudo ufw default allow outgoing

    # Allow essential services
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'

    # Block known attacking IPs
    sudo ufw deny from 159.223.2.190 comment 'Blocked attacker' 2>/dev/null || true
    sudo ufw deny from 161.35.146.183 comment 'Blocked attacker' 2>/dev/null || true

    # Enable firewall
    echo "y" | sudo ufw --force enable
    log_success "Firewall configured and enabled"
    sudo ufw status verbose | head -10
else
    log_warning "UFW not installed - install with: sudo apt install ufw"
fi
echo ""

# 4. Set Up Automatic Security Updates
log_info "4. Setting up automatic security updates..."
if ! dpkg -l | grep -q unattended-upgrades; then
    sudo apt install -y unattended-upgrades
    log_success "Unattended upgrades installed"
fi

# Configure automatic updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null 2>&1 || true
log_success "Automatic security updates configured"
echo ""

# 5. Secure SSH Keys
log_info "5. Securing SSH keys..."
if [ -d ~/.ssh ]; then
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/authorized_keys 2>/dev/null || true
    chmod 600 ~/.ssh/id_* 2>/dev/null || true
    log_success "SSH key permissions secured"
else
    log_warning "~/.ssh directory not found"
fi
echo ""

# 6. Secure Environment Files
log_info "6. Securing environment files..."
if [ -f /var/www/marinaobuv/web/.env ]; then
    chmod 600 /var/www/marinaobuv/web/.env
    log_success ".env file permissions secured"
fi
echo ""

# 7. Create Security Monitoring Script
log_info "7. Setting up security monitoring..."
sudo tee /usr/local/bin/security-monitor.sh > /dev/null <<'EOF'
#!/bin/bash
LOG_FILE="/var/log/security-monitor.log"

log_alert() {
    echo "[$(date -Is)] ALERT: $1" | tee -a "$LOG_FILE"
}

# Check for failed logins
FAILED=$(grep "Failed password" /var/log/auth.log 2>/dev/null | tail -20 | wc -l)
if [ "$FAILED" -gt 10 ]; then
    log_alert "High failed login attempts: $FAILED"
fi

# Check for suspicious processes
SUSPICIOUS=$(ps aux | grep -E "(xmrig|miner|crypto)" | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    log_alert "Suspicious process: $SUSPICIOUS"
fi

# Check disk space
DISK=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK" -gt 90 ]; then
    log_alert "Disk usage critical: ${DISK}%"
fi
EOF

sudo chmod +x /usr/local/bin/security-monitor.sh
log_success "Security monitoring script created"

# Add to cron (hourly)
(crontab -l 2>/dev/null | grep -v security-monitor.sh; echo "0 * * * * /usr/local/bin/security-monitor.sh") | crontab -
log_success "Security monitoring added to cron"
echo ""

# 8. Update System
log_info "8. Updating system packages..."
sudo apt update -qq
UPGRADABLE=$(apt list --upgradable 2>/dev/null | wc -l)
if [ "$UPGRADABLE" -gt 1 ]; then
    log_info "Found $((UPGRADABLE - 1)) packages to upgrade"
    log_warning "Run 'sudo apt upgrade' to update packages"
else
    log_success "System is up to date"
fi
echo ""

# 9. Check for Unauthorized Services
log_info "9. Checking for suspicious services..."
SUSPICIOUS_SERVICES=$(systemctl list-units --all --type=service | grep -E "(miner|c3pool|xmrig)" || true)
if [ -n "$SUSPICIOUS_SERVICES" ]; then
    log_warning "Found suspicious services:"
    echo "$SUSPICIOUS_SERVICES"
else
    log_success "No suspicious services found"
fi
echo ""

# Summary
echo "=========================================="
echo "Security Hardening Summary"
echo "=========================================="
echo ""
log_success "✅ Fail2Ban installed and configured"
log_success "✅ SSH hardened"
log_success "✅ Firewall configured"
log_success "✅ Automatic security updates enabled"
log_success "✅ Security monitoring set up"
echo ""
log_info "Next steps:"
echo "1. Review SSH configuration: sudo nano /etc/ssh/sshd_config"
echo "2. Review Fail2Ban settings: sudo nano /etc/fail2ban/jail.local"
echo "3. Update system packages: sudo apt upgrade"
echo "4. Review security logs: tail -f /var/log/security-monitor.log"
echo "5. Check Fail2Ban status: sudo fail2ban-client status sshd"
echo ""
log_warning "⚠️  IMPORTANT: Test SSH access before closing this session!"
echo ""
log_info "Hardening completed at: $(date)"
