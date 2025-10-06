# Database Authentication Fixes

## Problem Analysis

The server was experiencing database authentication failures with the error:
```
Authentication failed against database server at `localhost`, the provided database credentials for `marinaobuv_user` are not valid.
```

## Root Cause

The GitHub Actions deployment workflow was not properly setting up the PostgreSQL database user and permissions, causing authentication failures.

## Fixes Implemented

### 1. Enhanced GitHub Actions Workflow

**File**: `.github/workflows/deploy-pm2.yml`

**Changes**:
- Added database setup script execution during deployment
- Improved database connectivity health checks
- Added automatic database user and permission creation
- Enhanced error handling and recovery procedures

**Key improvements**:
```yaml
# Use the database setup script
echo "🔧 Running database setup script..."
chmod +x scripts/setup-database.sh
export DATABASE_URL="${{ secrets.DATABASE_URL }}"
./scripts/setup-database.sh
```

### 2. Database Setup Script

**File**: `scripts/setup-database.sh`

**Purpose**: Automatically sets up PostgreSQL database and user with proper permissions

**Features**:
- Parses DATABASE_URL to extract connection details
- Creates database user with proper authentication
- Creates database with correct ownership
- Grants all necessary privileges
- Tests database connectivity
- Handles existing users/databases gracefully

### 3. Database Authentication Fix Script

**File**: `scripts/fix-database-auth.sh`

**Purpose**: Fixes database authentication issues by recreating user and permissions

**Features**:
- Drops and recreates database user
- Grants comprehensive privileges (database, schema, tables, sequences)
- Sets default privileges for future objects
- Tests multiple connection methods
- Provides detailed error diagnostics

### 4. Enhanced Prisma Server Script

**File**: `web/prisma-server.sh`

**Improvements**:
- Better environment file detection
- DATABASE_URL validation
- Enhanced error messages
- Support for multiple environment files

### 5. New Package.json Scripts

**Added scripts**:
- `npm run db:setup` - Run database setup locally
- `npm run db:fix-auth` - Fix database authentication issues locally
- `npm run server:db:fix` - Fix database authentication on remote server

## Deployment Process

### Automatic Database Setup

The deployment process now includes:

1. **Pre-deployment Checks**
   - PostgreSQL service verification
   - DATABASE_URL validation
   - Database connectivity testing

2. **Database Setup**
   - User creation with proper authentication
   - Database creation with correct ownership
   - Privilege granting (database, schema, tables, sequences)
   - Default privilege configuration

3. **Health Verification**
   - Database connectivity testing
   - Automatic recovery if issues detected
   - Comprehensive error diagnostics

### Manual Database Fixes

If automatic setup fails, you can run:

```bash
# Fix database authentication on server
npm run server:db:fix

# Or run locally (if you have DATABASE_URL set)
npm run db:fix-auth
```

## Error Handling

### Automatic Recovery

The deployment process includes automatic recovery:

1. **Initial Setup Failure**: Runs database setup script
2. **Health Check Failure**: Runs authentication fix script
3. **Connection Test Failure**: Provides detailed diagnostics

### Manual Recovery

If automatic recovery fails:

1. **Check PostgreSQL Service**:
   ```bash
   sudo systemctl status postgresql
   ```

2. **Verify Database User**:
   ```bash
   sudo -u postgres psql -c "\du"
   ```

3. **Test Connection**:
   ```bash
   PGPASSWORD="your_password" psql -h localhost -U marinaobuv_user -d marinaobuv_db -c "SELECT 1;"
   ```

4. **Run Fix Script**:
   ```bash
   export DATABASE_URL="your_database_url"
   ./scripts/fix-database-auth.sh
   ```

## Monitoring

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that:
- Tests database connectivity
- Returns appropriate HTTP status codes
- Provides detailed error information

### Logs

Database issues are logged in:
- PM2 logs: `pm2 logs marinaobuv`
- Application logs: `web/logs/marinaobuv-error.log`
- System logs: `journalctl -u postgresql`

## Security Considerations

### Database Security

- Users are created with minimal required privileges
- Passwords are properly handled via environment variables
- Connection strings are validated before use

### Environment Security

- DATABASE_URL is loaded from GitHub Secrets
- Environment files are properly secured
- No hardcoded credentials in scripts

## Testing

### Local Testing

```bash
# Set up database locally
export DATABASE_URL="postgresql://user:password@localhost:5432/database"
npm run db:setup

# Test connection
cd web && ./prisma-server.sh npx prisma db pull --print
```

### Server Testing

```bash
# Test server database connection
npm run server:logs

# Fix authentication issues
npm run server:db:fix
```

## Troubleshooting

### Common Issues

1. **User Already Exists**: Script handles gracefully
2. **Database Already Exists**: Script handles gracefully
3. **Permission Denied**: Script grants comprehensive privileges
4. **Connection Refused**: Script checks PostgreSQL service

### Debug Commands

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database users
sudo -u postgres psql -c "\du"

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Test connection
PGPASSWORD="password" psql -h localhost -U user -d database -c "SELECT 1;"
```

## Conclusion

These fixes ensure that:

1. **Database is automatically configured** during deployment
2. **Authentication issues are automatically resolved**
3. **Comprehensive error handling** provides clear diagnostics
4. **Manual recovery options** are available if needed
5. **Security best practices** are followed

The deployment process is now robust and should handle database configuration automatically without manual intervention.
