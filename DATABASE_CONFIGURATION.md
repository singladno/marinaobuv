# Database Configuration Guide

## Overview

This document describes the database configuration and deployment process for the MarinaObuv project. The database configuration has been enhanced to ensure reliable deployment and proper initialization.

## Database Setup Process

### 1. Environment Configuration

- Database connection is configured via `DATABASE_URL` environment variable
- Production environment variables are loaded from GitHub Secrets
- Environment file is created during deployment: `web/.env.production`

### 2. Database Initialization Steps

#### Pre-deployment Checks

1. **PostgreSQL Service Check**: Ensures PostgreSQL is running and enabled
2. **Database URL Validation**: Verifies `DATABASE_URL` is set in secrets
3. **Connection Test**: Tests database connectivity before proceeding

#### Database Operations

1. **Backup Creation**: Creates database backup before migrations
2. **Prisma Client Generation**: Generates Prisma client with proper environment
3. **Migration Status Check**: Checks current migration status
4. **Migration Execution**: Runs database migrations with error handling
5. **Database Initialization**: Initializes database with proper configuration
6. **Data Seeding**: Seeds database with initial data if needed

#### Post-deployment Verification

1. **Health Check**: Verifies database connectivity via API endpoint
2. **Recovery Process**: Attempts database recovery if issues are detected

## Scripts and Commands

### Database Management Scripts

- `npm run db:init` - Initialize database configuration
- `npm run db:backup` - Create database backup
- `npm run db:recover` - Attempt database recovery
- `npm run prisma:migrate:deploy` - Deploy database migrations
- `npm run prisma:seed` - Seed database with initial data

### Health Check Endpoint

- `GET /api/health` - Returns database connectivity status
- Includes database connection test
- Returns appropriate HTTP status codes

## Error Handling

### Migration Failures

1. **Backup Creation**: Creates backup before attempting migrations
2. **Recovery Attempt**: Runs database recovery script
3. **Reset and Retry**: Resets database and retries migrations
4. **Manual Intervention**: Provides guidance for manual fixes

### Connection Issues

1. **Service Check**: Verifies PostgreSQL service is running
2. **Connection Test**: Tests database connectivity
3. **Environment Validation**: Ensures proper environment variables
4. **Recovery Process**: Attempts to restore from backup

## Deployment Process

### GitHub Actions Workflow

The deployment process includes the following database-related steps:

1. **Environment Setup**

   - Load production environment variables
   - Verify database URL is configured
   - Test database connection

2. **Database Preparation**

   - Create database backup
   - Generate Prisma client
   - Check migration status

3. **Migration Execution**

   - Run database migrations
   - Handle migration failures
   - Attempt recovery if needed

4. **Database Initialization**

   - Initialize database configuration
   - Seed initial data
   - Verify database setup

5. **Health Verification**
   - Test database connectivity
   - Verify API health endpoint
   - Ensure proper database configuration

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check PostgreSQL service status
   - Verify DATABASE_URL configuration
   - Check network connectivity

2. **Migration Failures**

   - Check database permissions
   - Verify migration files
   - Check for conflicting changes

3. **Seeding Issues**
   - Verify seed data format
   - Check database constraints
   - Ensure proper data types

### Recovery Procedures

1. **Database Recovery**

   - Run `npm run db:recover`
   - Check backup files
   - Restore from backup if needed

2. **Migration Recovery**

   - Reset database: `npm run prisma:migrate:deploy`
   - Check migration status
   - Re-run migrations if needed

3. **Manual Intervention**
   - Access database directly
   - Check logs for specific errors
   - Contact system administrator

## Monitoring and Maintenance

### Health Monitoring

- Database connectivity is monitored via `/api/health` endpoint
- Health checks run during deployment
- Continuous monitoring of database status

### Backup Management

- Automatic backups before migrations
- Backup retention (keeps last 5 backups)
- Backup verification and testing

### Performance Considerations

- Database connection pooling
- Query optimization
- Index management
- Regular maintenance tasks

## Security Considerations

### Database Security

- Secure connection strings
- Environment variable protection
- Access control and permissions
- Regular security updates

### Backup Security

- Encrypted backup storage
- Secure backup access
- Regular backup testing
- Disaster recovery procedures

## Conclusion

The database configuration has been enhanced to provide:

- Reliable deployment process
- Comprehensive error handling
- Automatic recovery procedures
- Health monitoring and verification
- Backup and restore capabilities

This ensures that the database is properly configured and maintained throughout the deployment lifecycle.
