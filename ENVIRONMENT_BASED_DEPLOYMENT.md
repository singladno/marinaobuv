# Environment-Based Deployment

## Overview

The deployment process has been updated to use environment files instead of GitHub Secrets for better security and reliability.

## Changes Made

### 1. Removed GitHub Secrets Dependency

**Before**: Used GitHub Secrets for all configuration
**After**: Uses environment files for configuration

### 2. Updated GitHub Actions Workflow

**File**: `.github/workflows/deploy-pm2.yml`

**Key Changes**:

- Removed all `${{ secrets.* }}` references
- Added environment file detection and loading
- Simplified build and test processes
- Enhanced error handling for missing environment files

### 3. Environment File Priority

The deployment process now looks for environment files in this order:

1. `web/.env` (main environment file)
2. `web/env.example` (template fallback)

### 4. Created Environment Template

**File**: `web/env.example`

Contains all required environment variables with example values:

- Database configuration
- API keys and tokens
- Service endpoints
- Processing settings

## Benefits

### 🔒 Security

- No sensitive data in GitHub Secrets
- Environment files can be properly secured on server
- Local development uses separate environment files

### 🚀 Reliability

- No dependency on GitHub Secrets configuration
- Environment files are version controlled (except sensitive ones)
- Consistent configuration across deployments

### 🛠️ Maintainability

- Easy to update configuration
- Clear separation of concerns
- Template file for new deployments

## Deployment Process

### 1. Environment File Setup

The deployment process automatically:

1. **Checks for existing environment files**
2. **Uses the appropriate file** (`.env` > `env.example`)
3. **Loads environment variables** for database setup
4. **Validates configuration** before proceeding

### 2. Database Configuration

The database setup now uses the `DATABASE_URL` from the environment file:

```bash
# Load environment variables
export $(cat web/.env | grep -v '^#' | xargs)

# Run database setup
./scripts/setup-database.sh
```

### 3. Error Handling

If no environment file is found:

- Deployment fails with clear error message
- Suggests creating environment file
- Provides template file as fallback

## Environment File Structure

### Required Variables

```bash
# Core Configuration
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://marina-obuv.ru
NEXT_PUBLIC_BRAND_NAME=MarinaObuv

# Database Configuration
DATABASE_URL=postgresql://marinaobuv_user:marinaobuv_password@localhost:5432/marinaobuv

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://marina-obuv.ru

# API Keys and Services
WHAPI_TOKEN=your_whapi_token_here
OPENAI_API_KEY=your_openai_api_key
S3_ACCESS_KEY=your_s3_access_key
# ... and more
```

## Setup Instructions

### For New Deployments

1. **Copy the template**:

   ```bash
   cp web/env.example web/.env.production
   ```

2. **Update with your values**:

   ```bash
   nano web/.env.production
   ```

3. **Deploy**:
   ```bash
   git add web/.env.production
   git commit -m "Add production environment configuration"
   git push origin main
   ```

### For Existing Deployments

1. **Update existing environment file** with correct values
2. **Deploy** - the process will use your existing configuration

## Security Considerations

### Environment File Security

- **Never commit sensitive environment files** to version control
- **Use `.env`** for environment configuration
- **Keep `env.example`** as a template with placeholder values
- **Secure environment files** on the server with proper permissions

### Database Security

- **Database credentials** are now in environment files
- **User creation** uses credentials from environment
- **Password management** is handled through environment variables

## Troubleshooting

### Missing Environment File

**Error**: `No environment file found!`

**Solution**: Create environment file:

```bash
cp web/env.example web/.env
# Edit with your values
```

### Invalid DATABASE_URL

**Error**: `DATABASE_URL is not set in environment file!`

**Solution**: Check environment file format:

```bash
# Should be in format:
DATABASE_URL=postgresql://user:password@host:port/database
```

### Database Connection Issues

**Error**: Database authentication failures

**Solution**: Run database fix script:

```bash
npm run server:db:fix
```

## Migration from GitHub Secrets

### Step 1: Create Environment File

```bash
# On server
cd /var/www/marinaobuv
cp web/env.example web/.env
```

### Step 2: Update Values

Edit `web/.env` with your actual values from GitHub Secrets.

### Step 3: Test Deployment

```bash
# Test locally first
npm run db:setup

# Then deploy
git add web/.env
git commit -m "Migrate to environment-based configuration"
git push origin main
```

## Conclusion

The environment-based deployment approach provides:

- **Better Security**: No sensitive data in GitHub Secrets
- **Improved Reliability**: Consistent configuration management
- **Easier Maintenance**: Clear separation of configuration
- **Flexible Deployment**: Support for multiple environments

This approach ensures that deployments will work consistently without depending on external secret management systems.
