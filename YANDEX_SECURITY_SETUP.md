# Yandex Smart Web Security Setup Guide

## Current Status

✅ **Smart Protection**: Enabled
❌ **Connected Resources**: Not connected (shows "-")
⚠️ **Action Required**: Connect security profile to your application

## Issue

Your security profile "Security" (ID: `fevolsef1p1tinhmg8pp`) has:
- ✅ Smart Protection enabled
- ✅ 2 rules configured
- ❌ **NOT connected to any resources** - This means it's not protecting your application!

## Steps to Connect Security Profile

### 1. Identify Your Application Load Balancer or CDN

You need to connect the security profile to:
- **Application Load Balancer** (if using Yandex Cloud Load Balancer)
- **Cloud CDN** (if using Yandex CDN)
- **API Gateway** (if using API Gateway)

### 2. Connect Security Profile

**Option A: Via Application Load Balancer**

1. Go to **Yandex Cloud Console** → **Application Load Balancer**
2. Find your load balancer (the one serving `marina-obuv.ru`)
3. Click on the load balancer
4. Go to **Settings** or **Security** tab
5. Find **Security profiles** section
6. Select your "Security" profile
7. Save changes

**Option B: Via Cloud CDN**

1. Go to **Yandex Cloud Console** → **Cloud CDN**
2. Find your CDN resource
3. Click on it
4. Go to **Settings** → **Security**
5. Select your "Security" profile
6. Save changes

### 3. Verify Connection

After connecting:
- Go back to **Smart Web Security** → **Security profiles**
- Check "Connected resources" column
- Should show your load balancer/CDN name instead of "-"

## Verify WAF Rule

The document mentions rule `yars-v0.1.0-id8080234-attack-rce` should be included.

To check:

1. Go to **Smart Web Security** → **Security profiles**
2. Click on your "Security" profile
3. Go to **Rules** tab
4. Look for rule with ID or name containing `yars-v0.1.0-id8080234-attack-rce`
5. Verify it's **enabled** (not just in logging mode)

If the rule is missing:

1. Click **Edit** on the security profile
2. Go to **Rules**
3. Add rule: `yars-v0.1.0-id8080234-attack-rce`
4. Set mode to **Block** (not just logging)
5. Save

## Complete Security Checklist

### ✅ Application Level (Done)
- [x] React updated to 19.2.1
- [x] Next.js updated to 16.0.7
- [x] Dependencies updated

### ⚠️ Infrastructure Level (Needs Action)
- [ ] Security profile connected to Load Balancer/CDN
- [ ] WAF rule `yars-v0.1.0-id8080234-attack-rce` verified
- [ ] Smart Protection enabled (✅ Done)
- [ ] Rules set to "Block" mode (not just logging)

### 🔒 Server Level (From Previous Steps)
- [ ] Fail2Ban installed and configured
- [ ] SSH hardened
- [ ] Firewall configured
- [ ] System updated
- [ ] Monitoring set up

## Why Connection is Critical

Without connecting the security profile:
- ❌ WAF rules are not active
- ❌ Smart Protection is not protecting your application
- ❌ RCE protection is not enabled
- ❌ Your application is vulnerable despite having the profile

**The security profile must be connected to actually protect your application!**

## Testing After Connection

After connecting:

1. **Check logs**:
   - Go to **Smart Web Security** → **Logs**
   - Verify requests are being analyzed

2. **Test protection**:
   - Try accessing a known malicious endpoint
   - Should be blocked by WAF

3. **Monitor performance**:
   - Check application response times
   - Verify no false positives blocking legitimate traffic

## Additional Recommendations

1. **Review all 2 rules** in your security profile
2. **Set rules to "Block" mode** (not just logging) for production
3. **Enable logging** to monitor blocked requests
4. **Set up alerts** for security events
5. **Regularly review** blocked requests to tune rules

## Next Steps

1. **Immediate**: Connect security profile to your load balancer/CDN
2. **Verify**: Check that WAF rule is active
3. **Test**: Verify protection is working
4. **Monitor**: Set up alerts for security events

---

**Current Status**: Security profile exists but is NOT protecting your application. Connection is required!
