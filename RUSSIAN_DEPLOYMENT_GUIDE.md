# Russian Deployment Guide for MarinaObuv

This guide will help you deploy MarinaObuv to a Russian server using Yandex Cloud, RU-CENTER domain, and Russian-compliant infrastructure.

## Prerequisites

- Yandex Cloud account
- RU-CENTER account for domain registration
- GitHub repository with your code
- Basic knowledge of Linux and Docker

## Step 1: Domain Registration (RU-CENTER)

### 1.1 Register Domain

1. Go to [RU-CENTER](https://www.nic.ru/)
2. Search for available `.ru` domains
3. Register `marinaobuv.ru` (or your preferred domain)
4. Complete payment (500-1000₽/year)

### 1.2 Configure DNS

1. In RU-CENTER control panel, go to DNS management
2. Add A record: `@` → `YOUR_SERVER_IP`
3. Add A record: `www` → `YOUR_SERVER_IP`
4. Wait for DNS propagation (5-30 minutes)

## Step 2: Yandex Cloud Setup

### 2.1 Create VPS

1. Go to [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Create new VPS instance:
   - **OS**: Ubuntu 22.04 LTS
   - **CPU**: 1 vCPU
   - **RAM**: 1GB
   - **Storage**: 20GB SSD
   - **Network**: Public IP
3. Note down your server IP address

### 2.2 Configure SSH Access

1. Generate SSH key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ```
2. Add public key to Yandex Cloud VPS
3. Test SSH connection:
   ```bash
   ssh ubuntu@YOUR_SERVER_IP
   ```

## Step 3: Server Setup

### 3.1 Initial Server Configuration

```bash
# Connect to your server
ssh ubuntu@YOUR_SERVER_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/your-username/marinaobuv/main/scripts/setup-russian-server.sh | bash

# Reboot server
sudo reboot
```

### 3.2 Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/marinaobuv.git /var/www/marinaobuv
cd /var/www/marinaobuv

# Set proper permissions
sudo chown -R $USER:$USER /var/www/marinaobuv
```

### 3.3 Configure Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit environment variables
nano .env.production
```

Fill in your environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `S3_*`: Your S3 storage credentials
- `NEXTAUTH_SECRET`: Generate a secure secret
- `NEXTAUTH_URL`: Your domain URL

## Step 4: VPN Setup for OpenAI Access

### 4.1 Configure WireGuard

```bash
# Run WireGuard setup script
sudo bash scripts/setup-wireguard.sh

# Edit WireGuard configuration
sudo nano /etc/wireguard/wg0.conf
```

### 4.2 Get VPN Provider Details

You'll need a VPN provider that supports WireGuard and allows OpenAI access:

**Recommended VPN Providers:**

- **NordVPN**: Supports WireGuard, good for OpenAI
- **Surfshark**: Affordable, supports WireGuard
- **ExpressVPN**: Premium option, excellent performance

**Configuration Steps:**

1. Sign up with VPN provider
2. Get WireGuard configuration details
3. Update `/etc/wireguard/wg0.conf` with provider details
4. Start WireGuard: `sudo systemctl start wireguard`

## Step 5: Database Setup

### Option A: Self-hosted PostgreSQL (Recommended for budget)

```bash
# PostgreSQL is already configured in docker-compose.prod.yml
# No additional setup needed
```

### Option B: Yandex Managed Database

1. Go to Yandex Cloud Console
2. Create PostgreSQL managed database
3. Update `DATABASE_URL` in `.env.production`
4. Cost: ~1000-3000₽/month

## Step 6: SSL Certificate Setup

### 6.1 Get SSL Certificate

```bash
# Run SSL setup script
sudo bash scripts/setup-ssl.sh marinaobuv.ru
```

### 6.2 Verify SSL

- Check certificate: `openssl s_client -connect marinaobuv.ru:443`
- Test in browser: `https://marinaobuv.ru`

## Step 7: Deploy Application

### 7.1 Deploy Application

```bash
# Run deployment script
bash scripts/deploy.sh
```

### 7.2 Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test application
curl -I https://marinaobuv.ru
```

## Step 8: GitHub Actions Setup

### 8.1 Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- `RUSSIAN_HOST`: Your server IP
- `RUSSIAN_USERNAME`: Server username (usually `ubuntu`)
- `RUSSIAN_SSH_KEY`: Your private SSH key
- `DATABASE_URL`: Your database connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXTAUTH_SECRET`: Your NextAuth secret
- `NEXTAUTH_URL`: Your domain URL
- `S3_*`: Your S3 credentials

### 8.2 Test Deployment

1. Make a small change to your code
2. Push to `main` branch
3. Check GitHub Actions tab for deployment status
4. Verify your site is updated

## Step 9: Monitoring and Maintenance

### 9.1 Setup Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Check system resources
htop
df -h
free -h
```

### 9.2 Setup Backups

```bash
# Create backup script
sudo tee /usr/local/bin/backup-marinaobuv.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/marinaobuv/backups"
mkdir -p \$BACKUP_DIR

# Backup database
docker-compose -f /var/www/marinaobuv/docker-compose.prod.yml exec -T db pg_dump -U marinaobuv_user marinaobuv > \$BACKUP_DIR/db_\$DATE.sql

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz /var/www/marinaobuv

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-marinaobuv.sh

# Add to crontab
echo "0 2 * * * /usr/local/bin/backup-marinaobuv.sh" | sudo crontab -
```

## Troubleshooting

### Common Issues

#### 1. Domain Not Resolving

```bash
# Check DNS propagation
nslookup marinaobuv.ru
dig marinaobuv.ru

# Wait for DNS propagation (up to 24 hours)
```

#### 2. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --dry-run
```

#### 3. OpenAI API Not Working

```bash
# Check VPN status
sudo wg show

# Test OpenAI API access
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

#### 4. Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db psql -U marinaobuv_user -d marinaobuv -c "SELECT 1;"
```

### Logs and Debugging

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f web

# Database logs
docker-compose -f docker-compose.prod.yml logs -f db

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u wireguard -f
```

## Cost Breakdown

### Monthly Costs (Russian Rubles):

- **Domain (.ru)**: 500-1000₽/year
- **Yandex Cloud VPS**: 500-2000₽/month
- **Database**: 0-3000₽/month (self-hosted vs managed)
- **VPN**: 500-2000₽/month
- **Total**: 1000-7000₽/month

### One-time Setup:

- **Time**: 2-3 days
- **Technical knowledge**: Intermediate

## Security Considerations

1. **Firewall**: Configure UFW firewall
2. **SSH**: Use key-based authentication
3. **Updates**: Regular system updates
4. **Backups**: Automated daily backups
5. **Monitoring**: Set up monitoring and alerts
6. **SSL**: Use Let's Encrypt certificates
7. **VPN**: Secure OpenAI access through VPN

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Verify all environment variables are set correctly
4. Ensure all services are running properly

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure automated backups
3. Set up staging environment
4. Implement CI/CD pipeline
5. Add performance monitoring
6. Set up error tracking (Sentry)

Your MarinaObuv application should now be running on a Russian-compliant infrastructure! 🎉
