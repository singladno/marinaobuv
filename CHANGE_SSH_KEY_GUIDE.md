# Change SSH Key for Yandex Server

## Overview

This guide will help you:

1. Generate a new SSH key
2. Add it to the server
3. Test the connection
4. Remove old keys
5. Update configurations

## Step 1: Generate New SSH Key

On your **local machine** (Mac):

```bash
# Generate new Ed25519 key (recommended, more secure)
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_yandex_new

# Or if you prefer RSA (longer, but widely supported)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/id_rsa_yandex_new
```

**When prompted:**

- **File location**: Press Enter to use default, or specify custom name
- **Passphrase**: **Highly recommended** - Enter a strong passphrase for extra security

**Output:**

- Private key: `~/.ssh/id_ed25519_yandex_new` (keep this secret!)
- Public key: `~/.ssh/id_ed25519_yandex_new.pub` (this goes on the server)

## Step 2: Get Your New Public Key

```bash
# Display your new public key
cat ~/.ssh/id_ed25519_yandex_new.pub

# Copy it to clipboard (Mac)
cat ~/.ssh/id_ed25519_yandex_new.pub | pbcopy
```

**Save this output** - you'll need it in the next step.

## Step 3: Add New Key to Server

You have two options:

### Option A: Via Console (Recommended - Most Secure)

1. **Access server via console** (Yandex Cloud Console → VNC/Serial Console)
2. **Login** with your current credentials
3. **Add the new key**:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add new public key
echo "YOUR_NEW_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Verify it was added
cat ~/.ssh/authorized_keys
```

**Replace `YOUR_NEW_PUBLIC_KEY_HERE`** with the public key from Step 2.

### Option B: Via Current SSH Session (If You Can Still Connect)

If you can still SSH in with your current key:

```bash
# SSH into server with current key
ssh -i ~/.ssh/id_ed25519_server ubuntu@130.193.56.134

# Once connected, add new key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_NEW_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

## Step 4: Test New Key Connection

**Before removing old keys**, test the new one:

```bash
# Test connection with new key
ssh -i ~/.ssh/id_ed25519_yandex_new ubuntu@130.193.56.134

# If it works, you'll be logged in!
# Exit to continue
exit
```

**If it doesn't work:**

- Check the public key was added correctly
- Verify permissions: `chmod 600 ~/.ssh/authorized_keys`
- Check SSH logs on server: `sudo tail -f /var/log/auth.log`

## Step 5: Update Local SSH Config

Update your `~/.ssh/config` to use the new key:

```bash
# Edit SSH config
nano ~/.ssh/config
```

**Update or add this entry:**

```
Host 130.193.56.134
  HostName 130.193.56.134
  User ubuntu
  IdentityFile ~/.ssh/id_ed25519_yandex_new
  IdentitiesOnly yes
  PubkeyAuthentication yes
```

**Save and test:**

```bash
# Test connection (should work without specifying key)
ssh 130.193.56.134
```

## Step 6: Remove Old Keys (After Testing)

**Only after confirming new key works!**

### On Server:

```bash
# SSH in with new key
ssh -i ~/.ssh/id_ed25519_yandex_new ubuntu@130.193.56.134

# Backup authorized_keys first
cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup

# View current keys
cat ~/.ssh/authorized_keys

# Edit and remove old keys (keep only the new one)
nano ~/.ssh/authorized_keys
# Delete lines with old keys, keep only your new key

# Or use sed to remove specific old key
# (Replace OLD_KEY_FINGERPRINT with part of your old key)
sed -i '/OLD_KEY_FINGERPRINT/d' ~/.ssh/authorized_keys

# Verify only new key remains
cat ~/.ssh/authorized_keys
```

### On Local Machine:

```bash
# Remove old key from SSH agent (if added)
ssh-add -D

# Optionally remove old key file (or keep as backup)
# mv ~/.ssh/id_ed25519_server ~/.ssh/id_ed25519_server.backup
```

## Step 7: Update GitHub Actions Secrets

If you use GitHub Actions for deployment:

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Find `SSH_PRIVATE_KEY` secret
4. Click **Update**
5. Copy your **new private key**:

```bash
# Display private key (copy entire output)
cat ~/.ssh/id_ed25519_yandex_new
```

6. Paste into GitHub secret
7. Save

**Important**: The private key should include:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...key content...
-----END OPENSSH PRIVATE KEY-----
```

## Step 8: Update Cloud-Init Config (For Future Deployments)

Update `cloud-init-config.yaml` for future server deployments:

```bash
# Get your new public key
cat ~/.ssh/id_ed25519_yandex_new.pub

# Edit cloud-init config
nano cloud-init-config.yaml
```

**Update line 16:**

```yaml
ssh_authorized_keys:
  - ssh-ed25519 YOUR_NEW_PUBLIC_KEY_HERE your-email@example.com
```

**Replace with your new public key.**

## Step 9: Verify Everything Works

### Test SSH Connection:

```bash
# Should work without specifying key (uses config)
ssh ubuntu@130.193.56.134

# Or explicitly
ssh -i ~/.ssh/id_ed25519_yandex_new ubuntu@130.193.56.134
```

### Test GitHub Actions:

1. Push a commit or trigger a workflow
2. Check workflow logs
3. Verify SSH connection step succeeds

### Verify Server Security:

```bash
# Check authorized_keys on server
ssh ubuntu@130.193.56.134 "cat ~/.ssh/authorized_keys"

# Should only show your new key
```

## Troubleshooting

### "Permission denied (publickey)"

**Check:**

1. Public key is in `~/.ssh/authorized_keys` on server
2. Permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Directory permissions: `chmod 700 ~/.ssh`
4. Correct user: `ubuntu` (not `root`)

### "Too many authentication failures"

**Fix:**

```bash
# Specify key explicitly
ssh -i ~/.ssh/id_ed25519_yandex_new -o IdentitiesOnly=yes ubuntu@130.193.56.134
```

### Key Not Working After Adding

**Debug:**

```bash
# On server, check SSH logs
sudo tail -f /var/log/auth.log

# Try connecting with verbose output
ssh -v -i ~/.ssh/id_ed25519_yandex_new ubuntu@130.193.56.134
```

## Security Best Practices

1. **Use Ed25519 keys** (more secure than RSA)
2. **Add passphrase** to private key
3. **Use SSH agent** to avoid typing passphrase:
   ```bash
   ssh-add ~/.ssh/id_ed25519_yandex_new
   ```
4. **Keep old keys as backup** (rename, don't delete immediately)
5. **Rotate keys regularly** (every 6-12 months)
6. **Use different keys** for different servers

## Quick Reference Commands

```bash
# Generate new key
ssh-keygen -t ed25519 -C "email@example.com" -f ~/.ssh/id_ed25519_yandex_new

# Display public key
cat ~/.ssh/id_ed25519_yandex_new.pub

# Test connection
ssh -i ~/.ssh/id_ed25519_yandex_new ubuntu@130.193.56.134

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519_yandex_new

# Update SSH config
nano ~/.ssh/config
```

## Summary Checklist

- [ ] Generate new SSH key
- [ ] Copy public key
- [ ] Add public key to server (via console or SSH)
- [ ] Test new key connection
- [ ] Update local SSH config
- [ ] Remove old keys from server
- [ ] Update GitHub Actions secrets
- [ ] Update cloud-init-config.yaml
- [ ] Verify everything works
- [ ] Keep old key as backup (renamed)

## Important Notes

⚠️ **Don't remove old keys until new key is tested!**

⚠️ **Keep console access** in case something goes wrong

⚠️ **Backup authorized_keys** before making changes

✅ **Test thoroughly** before removing old keys

✅ **Update all places** that use the SSH key (GitHub Actions, scripts, etc.)
