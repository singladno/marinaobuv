# Fix Deployment Stuck on npm ci

## Current Issue

Deployment is stuck at `npm ci` command for 30+ minutes. This happens because:

1. **package-lock.json out of sync** - We updated package.json but lock file might not be synced
2. **npm ci hangs** - Can hang indefinitely if there are issues
3. **No timeout** - Previous workflow had no timeout for npm commands

## Immediate Actions

### Option 1: Cancel and Restart (Recommended)

1. **Cancel the current deployment** in GitHub Actions
2. **Commit the updated workflow** (I've added timeouts and fallbacks)
3. **Verify package-lock.json is committed**:
   ```bash
   git status web/package-lock.json
   ```
4. **If not committed, commit it**:
   ```bash
   git add web/package-lock.json
   git commit -m "Fix: Update package-lock.json to sync with package.json"
   git push
   ```
5. **Restart deployment**

### Option 2: Fix on Server (If Deployment Continues)

If you can SSH into the server, you can manually fix:

```bash
# SSH into server
ssh ubuntu@130.193.56.134

# Go to web directory
cd /var/www/marinaobuv/web

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# This should complete faster than npm ci
```

## What I Fixed in Workflow

I've updated `.github/workflows/deploy-pm2.yml` to:

1. **Add timeouts** to npm commands (600 seconds = 10 minutes)
2. **Fallback to npm install** if npm ci fails
3. **Increase overall timeouts** (3600s = 1 hour for entire deployment)
4. **Better error handling** with automatic recovery

## Root Cause

The issue is likely:
- `package-lock.json` on server has old versions
- `package.json` has new versions (React 19.2.1, Next.js 15.5.7)
- `npm ci` requires exact match, so it hangs trying to resolve

## Solution

### Step 1: Ensure package-lock.json is Committed

```bash
cd /Users/dali/Desktop/marinaobuv

# Check if package-lock.json has changes
git status web/package-lock.json

# If it shows as modified, commit it
git add web/package-lock.json
git commit -m "Fix: Sync package-lock.json with updated dependencies"
git push
```

### Step 2: Cancel Stuck Deployment

1. Go to GitHub Actions
2. Find the stuck workflow run
3. Click "Cancel workflow"

### Step 3: Commit Workflow Changes

The workflow file has been updated with timeouts. Commit it:

```bash
git add .github/workflows/deploy-pm2.yml
git commit -m "Fix: Add timeouts and fallbacks to npm commands in deployment"
git push
```

### Step 4: Restart Deployment

After pushing, the workflow will automatically restart, or you can manually trigger it.

## Alternative: Quick Fix on Server

If you want to unblock immediately without waiting:

```bash
# SSH to server
ssh ubuntu@130.193.56.134

# Kill any stuck npm processes
pkill -9 npm || true
pkill -9 node || true

# Clean and reinstall
cd /var/www/marinaobuv/web
rm -rf node_modules package-lock.json
npm install --no-audit --no-fund

# Continue with build
npm run build
```

## Prevention

The updated workflow now:
- ✅ Has timeouts (won't hang forever)
- ✅ Falls back to npm install if npm ci fails
- ✅ Regenerates package-lock.json if needed
- ✅ Better error messages

## Next Steps

1. **Cancel current deployment** (it's stuck anyway)
2. **Commit package-lock.json** if not already committed
3. **Commit workflow changes** (timeouts added)
4. **Push and restart** deployment

The new deployment should complete successfully with the fixes!
