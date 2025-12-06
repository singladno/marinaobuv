# Fix marinaobuv-startup.service

## Problem
The `marinaobuv-startup.service` is failing with error:
```
Job for marinaobuv-startup.service failed because the control process exited with error code.
Status: 203/EXEC (script not found or not executable)
```

The service is trying to run `/var/www/marinaobuv/scripts/auto-startup.sh` which doesn't exist.

## Quick Fix

Run this on your server:

```bash
cd /var/www/marinaobuv
git pull  # Get the latest fix script
bash scripts/fix-startup-service.sh
```

## What the Fix Does

1. **Checks the service file** - Looks at `/etc/systemd/system/marinaobuv-startup.service`
2. **Finds the correct script** - Uses `boot-restart.sh` which actually exists
3. **Updates the service** - Points it to the correct script
4. **Makes scripts executable** - Ensures proper permissions
5. **Reloads systemd** - Applies the changes
6. **Restarts the service** - Tests that it works

## Manual Fix (if script doesn't work)

### Option 1: Update service to use boot-restart.sh

```bash
# Edit the service file
sudo nano /etc/systemd/system/marinaobuv-startup.service

# Change this line:
ExecStart=/var/www/marinaobuv/scripts/auto-startup.sh

# To this:
ExecStart=/bin/bash /var/www/marinaobuv/scripts/boot-restart.sh

# Save and exit, then:
sudo systemctl daemon-reload
sudo systemctl restart marinaobuv-startup.service
sudo systemctl status marinaobuv-startup.service
```

### Option 2: Create the missing auto-startup.sh script

```bash
# Create the script
sudo tee /var/www/marinaobuv/scripts/auto-startup.sh > /dev/null <<'EOF'
#!/bin/bash
# Auto-startup wrapper script
cd /var/www/marinaobuv || exit 1

# Run the boot-restart script if it exists
if [ -f "scripts/boot-restart.sh" ]; then
    bash scripts/boot-restart.sh
else
    echo "boot-restart.sh not found, starting PM2 directly..."
    pm2 startOrReload ecosystem.config.js --env production || \
    pm2 start ecosystem.config.js --env production
    pm2 save
fi
EOF

# Make it executable
sudo chmod +x /var/www/marinaobuv/scripts/auto-startup.sh

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart marinaobuv-startup.service
```

### Option 3: Disable the service (if not needed)

If you don't need this service (PM2 can start manually), you can disable it:

```bash
sudo systemctl stop marinaobuv-startup.service
sudo systemctl disable marinaobuv-startup.service
sudo systemctl mask marinaobuv-startup.service
```

## Verify the Fix

After running the fix, check:

```bash
# Check service status
sudo systemctl status marinaobuv-startup.service

# Check if it's enabled
systemctl is-enabled marinaobuv-startup.service

# Check service logs
sudo journalctl -u marinaobuv-startup.service -n 50

# Check failed services (should not show marinaobuv-startup)
sudo systemctl --failed
```

## Expected Result

After the fix:
- ✅ Service should show as "active (exited)" or "inactive (dead)" - both are OK for oneshot services
- ✅ No longer in the failed services list
- ✅ Will run on next boot to start your application

## What is marinaobuv-startup.service?

This service is meant to automatically start your application when the server boots. It runs `boot-restart.sh` which:
- Pulls latest code from git
- Starts PM2 processes
- Configures webhooks
- Performs health checks
- Ensures all services are running

It's useful for automatic recovery after reboots.
