# Local Deployment Guide

## Overview

This guide explains how to run the same deployment process locally that runs on the server. This allows you to test the deployment process before pushing to production.

## Prerequisites

### System Requirements

- Node.js 20 or higher
- PostgreSQL (running locally)
- PM2 (will be installed automatically)
- Git

### Database Setup

1. **Install PostgreSQL**

   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Linux
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create Database**

   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database and user
   CREATE DATABASE marinaobuv;
   CREATE USER marinaobuv_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE marinaobuv TO marinaobuv_user;
   \q
   ```

3. **Configure Environment**
   - Copy `web/.env.example` to `web/.env.local`
   - Update `DATABASE_URL` with your local database credentials
   - Example: `DATABASE_URL="postgresql://marinaobuv_user:your_password@localhost:5432/marinaobuv"`

## Quick Start

### 1. Setup Local Environment

```bash
# Run the setup script
npm run setup:local
```

This will:

- Check Node.js version
- Install PM2 if needed
- Check PostgreSQL status
- Create .env.local if needed
- Install dependencies
- Generate Prisma client

### 2. Run Local Deployment

```bash
# Run the full deployment process
npm run deploy:local
```

This will:

- Set up environment
- Install dependencies
- Configure database
- Run migrations
- Seed database
- Build application
- Start with PM2
- Run health checks

## Manual Steps

If you prefer to run steps manually:

### 1. Environment Setup

```bash
# Install dependencies
npm install
cd web && npm install
cd ..

# Generate Prisma client
cd web
./prisma-server.sh npm run prisma:generate
cd ..
```

### 2. Database Setup

```bash
cd web

# Test database connection
./prisma-server.sh npx prisma db pull --print

# Create backup
./prisma-server.sh npm run db:backup

# Run migrations
./prisma-server.sh npm run prisma:migrate:deploy

# Initialize database
./prisma-server.sh npm run db:init

# Seed database
./prisma-server.sh npm run prisma:seed

cd ..
```

### 3. Build and Start

```bash
# Build application
cd web && npm run build && cd ..

# Start with PM2
pm2 delete marinaobuv-local 2>/dev/null || true
pm2 start ecosystem.local.config.js --env local
pm2 save
```

### 4. Health Check

```bash
# Check application status
curl http://localhost:3000/api/health

# Check PM2 status
pm2 status

# View logs
pm2 logs marinaobuv-local
```

## Available Scripts

### Package.json Scripts

- `npm run setup:local` - Setup local environment
- `npm run deploy:local` - Run full local deployment
- `npm run health` - Check application health
- `npm run logs` - View application logs
- `npm run status` - Check PM2 status

### Database Scripts

- `npm run db:init` - Initialize database
- `npm run db:backup` - Create database backup
- `npm run db:recover` - Attempt database recovery
- `npm run prisma:migrate:deploy` - Deploy migrations
- `npm run prisma:seed` - Seed database

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
pg_isready

# Check database exists
psql -l | grep marinaobuv

# Test connection
psql -h localhost -U marinaobuv_user -d marinaobuv
```

#### 2. Migration Failures

```bash
# Check migration status
cd web && ./prisma-server.sh npx prisma migrate status

# Reset and retry
cd web && ./prisma-server.sh npx prisma migrate reset --force
cd web && ./prisma-server.sh npm run prisma:migrate:deploy
```

#### 3. Build Failures

```bash
# Check Node.js version
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
cd web && rm -rf node_modules package-lock.json && npm install
```

#### 4. PM2 Issues

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs marinaobuv-local

# Restart application
pm2 restart marinaobuv-local

# Stop application
pm2 stop marinaobuv-local
```

### Health Checks

#### Application Health

```bash
# Check if application is running
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "time": "2024-01-01T00:00:00.000Z",
  "service": "web",
  "database": "connected"
}
```

#### Database Health

```bash
# Test database connection
cd web && ./prisma-server.sh npx prisma db pull --print
```

#### PM2 Health

```bash
# Check PM2 status
pm2 status

# Monitor resources
pm2 monit
```

## Configuration Files

### Local PM2 Configuration

- `ecosystem.local.config.js` - Local PM2 configuration
- Uses `marinaobuv-local` as app name
- Optimized for local development
- Includes logging configuration

### Environment Files

- `web/.env.local` - Local environment variables
- `web/.env.production` - Production environment (created during deployment)
- `web/.env.example` - Example environment file

## Development Workflow

### 1. Make Changes

```bash
# Make your changes to the code
# Test locally with: npm run dev
```

### 2. Test Deployment

```bash
# Run local deployment to test
npm run deploy:local
```

### 3. Verify Everything Works

```bash
# Check health
npm run health

# Check logs
npm run logs

# Test functionality
curl http://localhost:3000/api/health
```

### 4. Deploy to Production

```bash
# Push to main branch
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions will handle the deployment
```

## Best Practices

### 1. Always Test Locally

- Run `npm run deploy:local` before pushing
- Verify all functionality works
- Check database migrations
- Test health endpoints

### 2. Database Management

- Always backup before migrations
- Test migrations on local database first
- Use proper environment variables
- Monitor database health

### 3. Environment Configuration

- Keep local and production environments separate
- Use proper database credentials
- Test with production-like data
- Verify all environment variables

### 4. Monitoring

- Check application logs regularly
- Monitor database performance
- Test health endpoints
- Verify PM2 status

## Conclusion

The local deployment process mirrors the server deployment exactly, allowing you to:

- Test deployment process locally
- Verify database configuration
- Check application health
- Debug issues before production
- Ensure smooth deployments

This ensures that your production deployments will work reliably and reduces the risk of deployment failures.
