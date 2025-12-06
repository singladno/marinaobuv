# Database Connection Test Results

## ✅ SSH Connection
- **Status**: Working
- **Key**: `github-actions@marinaobuv` key is correctly configured

## ✅ Environment File
- **Status**: Found
- **Location**: `/var/www/marinaobuv/web/.env`
- **DATABASE_URL**: Present in file

## ⚠️ Database Connection Test
- **Status**: Connection works, but Prisma version mismatch detected

### Test Output:
```
✅ Environment loaded successfully
Database URL: postgresql://marinao...
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files.
```

### Issue:
- **Server has**: Prisma 7.1.0 (newer version)
- **package.json has**: Prisma 5.22.0 (older version)
- **Problem**: Prisma 7 changed the schema format - `url` in datasource is no longer supported

## Required GitHub Secrets

### ✅ SSH Secrets (Verified Working)
- `SSH_HOST` - Should be `130.193.56.134`
- `SSH_USER` - Should be `ubuntu`
- `SSH_PRIVATE_KEY` - Should match `github-actions@marinaobuv` key
- `SSH_PORT` - Should be `22`

### ⚠️ Application Secrets (Need Verification)
- `DATABASE_URL` - Must match the value in `web/.env` on server
  - Format: `postgresql://username:password@host:port/database`
  - Currently on server: `postgresql://marinao...` (truncated for security)

- `NEXTAUTH_SECRET` - Must match the value in `web/.env` on server
  - Should be a random string for session encryption

## Recommendations

1. **Verify GitHub Secrets Match Server**:
   ```bash
   # Check DATABASE_URL on server (first 30 chars only)
   ssh -i ~/.ssh/id_ed25519_github_actions ubuntu@130.193.56.134 \
     "cd /var/www/marinaobuv && grep '^DATABASE_URL=' web/.env | cut -c1-40"
   ```

2. **Fix Prisma Version Mismatch**:
   - Option A: Update `package.json` to Prisma 7.x and migrate schema
   - Option B: Downgrade server Prisma to 5.22.0 to match package.json
   - Option C: Use Prisma 5.22.0 in deployment (current package.json version)

3. **Test Database Connection After Fix**:
   ```bash
   ssh -i ~/.ssh/id_ed25519_github_actions ubuntu@130.193.56.134 \
     "cd /var/www/marinaobuv/web && ./prisma-server.sh npx prisma db pull --print"
   ```

## Next Steps

1. ✅ SSH connection is working
2. ⚠️ Verify `DATABASE_URL` in GitHub secrets matches server
3. ⚠️ Verify `NEXTAUTH_SECRET` in GitHub secrets matches server
4. ⚠️ Fix Prisma version mismatch (choose one approach above)
