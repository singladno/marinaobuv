# Remove Old marinaobuv-startup.service

## You're Right - It's Not Needed!

The `marinaobuv-startup.service` is an **old/legacy service** that's no longer used.

### Current Setup

Your system uses:
- **`marinaobuv-boot.service`** - Created by `boot-restart.sh`, handles boot recovery
- **PM2 startup** - PM2 has its own startup mechanism via `pm2 startup`

### The Old Service

- **`marinaobuv-startup.service`** - Tries to run `auto-startup.sh` (which doesn't exist)
- This is redundant and broken
- Should be **removed**, not fixed

## Quick Removal

Run this on your server:

```bash
cd /var/www/marinaobuv
git pull  # Get the removal script
bash scripts/remove-old-startup-service.sh
```

## Manual Removal

If you prefer to do it manually:

```bash
# Stop and disable the old service
sudo systemctl stop marinaobuv-startup.service
sudo systemctl disable marinaobuv-startup.service
sudo systemctl mask marinaobuv-startup.service

# Remove the service file
sudo rm /etc/systemd/system/marinaobuv-startup.service

# Reload systemd
sudo systemctl daemon-reload

# Verify it's gone
sudo systemctl --failed
# Should no longer show marinaobuv-startup.service
```

## Verify Current Services

After removal, check what's actually running:

```bash
# Check current boot service (should exist)
systemctl status marinaobuv-boot.service

# Check if it's enabled
systemctl is-enabled marinaobuv-boot.service

# Check PM2 startup
pm2 startup
```

## Summary

- ❌ **Remove**: `marinaobuv-startup.service` (old, broken, redundant)
- ✅ **Keep**: `marinaobuv-boot.service` (current, working)
- ✅ **Keep**: PM2 startup (handles PM2 processes on boot)

The old service was probably created before `boot-restart.sh` was set up to create its own service file.
