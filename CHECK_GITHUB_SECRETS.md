# GitHub Secrets Checklist

## Required Secrets for Deployment

Your workflow uses these secrets. Verify they're all set in GitHub:

### SSH Connection Secrets
- ✅ `SSH_HOST` - Server IP address (e.g., `130.193.56.134`)
- ✅ `SSH_USER` - SSH username (e.g., `ubuntu`)
- ✅ `SSH_PRIVATE_KEY` - Private SSH key (matching `github-actions@marinaobuv` key)
- ✅ `SSH_PORT` - SSH port (usually `22`)

### Application Secrets
- ⚠️ `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Should match the value in `web/.env` on the server
- ⚠️ `NEXTAUTH_SECRET` - NextAuth.js secret
  - Should be a random string (used for session encryption)
  - Should match the value in `web/.env` on the server

### GitHub Token (Auto-provided)
- ✅ `GITHUB_TOKEN` - Automatically provided by GitHub Actions (no setup needed)

### Optional: Proxy Server Secrets
- `PROXY_SSH_HOST` - Proxy server IP (if using proxy)
- `PROXY_SSH_USER` - Proxy server username
- `PROXY_SSH_PRIVATE_KEY` - Proxy server SSH key
- `PROXY_SSH_PORT` - Proxy server SSH port

## How to Check/Update Secrets

1. Go to: `https://github.com/YOUR_USERNAME/marinaobuv/settings/secrets/actions`
2. Review each secret
3. Update if needed

## Verification

### Check SSH Connection
```bash
# Test SSH connection locally
ssh -i ~/.ssh/id_ed25519_github_actions ubuntu@130.193.56.134 "echo 'SSH connection works'"
```

### Check Database Connection
```bash
# Test database connection via SSH
ssh -i ~/.ssh/id_ed25519_github_actions ubuntu@130.193.56.134 "cd /var/www/marinaobuv/web && ./prisma-server.sh npx prisma db pull --print"
```

### Check Server Environment
```bash
# Check if .env file exists and has DATABASE_URL
ssh -i ~/.ssh/id_ed25519_github_actions ubuntu@130.193.56.134 "cd /var/www/marinaobuv && cat web/.env | grep DATABASE_URL"
```

## Common Issues

1. **SSH connection fails**:
   - Private key doesn't match public key on server
   - Wrong `SSH_HOST` or `SSH_PORT`
   - Firewall blocking connection

2. **Database connection fails**:
   - `DATABASE_URL` in GitHub secret doesn't match server's `web/.env`
   - Database service not running
   - Wrong credentials in `DATABASE_URL`

3. **NextAuth errors**:
   - `NEXTAUTH_SECRET` in GitHub secret doesn't match server's `web/.env`
   - Secret is too short or weak
