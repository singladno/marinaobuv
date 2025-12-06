# Yandex Smart Web Security - Alternative Setup

## Current Situation

You're seeing: **"There are no load balancers in the current folder"**

This means:
- ❌ You don't have a Yandex Cloud Application Load Balancer
- ✅ You're using **Nginx directly on your server** (IP: 130.193.56.134)
- ✅ Your domain `marina-obuv.ru` points directly to the server

## The Problem

**Yandex Smart Web Security** requires:
- Either an **Application Load Balancer** (which you don't have)
- Or **Cloud CDN** (which you might not have)

Since you're using direct server access with Nginx, the security profile **cannot be connected** in the traditional way.

## Solutions

### Option 1: Set Up Yandex Cloud Application Load Balancer (Recommended for Full Protection)

This provides the best security but requires infrastructure changes:

1. **Create Application Load Balancer**:
   - Go to **Yandex Cloud Console** → **Application Load Balancer**
   - Click **Create load balancer**
   - Configure:
     - **Name**: `marinaobuv-lb`
     - **Region**: Same as your VM
     - **Network**: Your VM's network
     - **Target group**: Create new target group with your VM (130.193.56.134:80)
     - **Listener**: HTTP/HTTPS on ports 80/443
     - **Domain**: `marina-obuv.ru`

2. **Connect Security Profile**:
   - In load balancer settings → **Security**
   - Select your "Security" profile
   - Save

3. **Update DNS**:
   - Point `marina-obuv.ru` to the load balancer IP (not directly to 130.193.56.134)
   - Update A record in your DNS

**Pros**: Full WAF protection, DDoS protection, SSL termination
**Cons**: Additional cost, requires DNS change, more complex setup

### Option 2: Use Cloud CDN (If Available)

If you have Yandex Cloud CDN:

1. **Create CDN Resource**:
   - Go to **Cloud CDN**
   - Create resource pointing to your origin (130.193.56.134)
   - Configure domain: `marina-obuv.ru`

2. **Connect Security Profile**:
   - In CDN settings → **Security**
   - Select your "Security" profile

3. **Update DNS**:
   - Point domain to CDN endpoint

**Pros**: Caching + security, better performance
**Cons**: Requires CDN setup, DNS change

### Option 3: Server-Level Security (Current Setup)

Since you can't connect the security profile without a load balancer/CDN, focus on:

#### ✅ What You Already Have:
- Nginx with security headers
- Server-level firewall (UFW)
- Fail2Ban (if installed)
- Updated React/Next.js

#### 🔒 Additional Server-Level Protection:

1. **Nginx ModSecurity** (WAF at Nginx level):
   ```bash
   # Install ModSecurity
   sudo apt install -y libmodsecurity3 modsecurity-crs

   # Configure in Nginx
   # Add to nginx config:
   modsecurity on;
   modsecurity_rules_file /etc/nginx/modsec/main.conf;
   ```

2. **Rate Limiting** (Already in your config):
   - Already configured in your Nginx configs
   - Limits API requests to prevent abuse

3. **Fail2Ban** (From security hardening):
   - Blocks brute force attacks
   - Protects SSH and web services

4. **Security Headers** (Already configured):
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Referrer-Policy

## Recommendation

### Short Term (Now):
1. **Keep the security profile** - It's ready if you add a load balancer later
2. **Focus on server security**:
   - Run `bash scripts/harden-security.sh` (if not done)
   - Ensure Fail2Ban is active
   - Keep system updated
   - Monitor logs regularly

### Long Term (Best Security):
1. **Set up Application Load Balancer**:
   - Provides WAF protection
   - DDoS protection
   - Better scalability
   - Can connect your security profile

2. **Or use Cloud CDN**:
   - If CDN is available
   - Provides caching + security

## Current Security Status

### ✅ Protected (Server-Level):
- [x] Nginx security headers
- [x] Rate limiting
- [x] Firewall (UFW)
- [x] Updated React/Next.js
- [ ] Fail2Ban (install if not done)
- [ ] SSH hardening (do if not done)

### ⚠️ Not Protected (Cloud-Level):
- [ ] Yandex Smart Web Security WAF (requires load balancer/CDN)
- [ ] Cloud-level DDoS protection
- [ ] Cloud-level rate limiting

## Action Items

### Immediate:
1. **Don't worry about the security profile connection** - It requires infrastructure you don't have
2. **Focus on server security**:
   ```bash
   cd /var/www/marinaobuv
   bash scripts/harden-security.sh
   ```
3. **Verify current protections**:
   - Check Nginx is running: `sudo systemctl status nginx`
   - Check firewall: `sudo ufw status`
   - Check Fail2Ban: `sudo systemctl status fail2ban`

### Future (Optional):
- Consider setting up Application Load Balancer for full cloud WAF protection
- Or use Cloud CDN if available

## Summary

**The security profile cannot be connected** because you don't have a load balancer or CDN. This is **OK for now** - you can still secure your application at the server level with:
- Nginx security headers ✅
- Rate limiting ✅
- Fail2Ban ✅
- Firewall ✅
- Updated dependencies ✅

The Yandex Smart Web Security profile will be ready if you decide to add a load balancer or CDN later.
