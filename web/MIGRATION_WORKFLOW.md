# Database Migration Workflow Guide

## 🚨 CRITICAL: Always Follow This Process

### 1. **Before Making Schema Changes**

```bash
# Always pull latest changes first
git pull origin main
```

### 2. **Creating Migrations**

```bash
# Make your schema changes in prisma/schema.prisma
# Then generate migration
npx prisma migrate dev --name descriptive_migration_name

# Example:
npx prisma migrate dev --name add_user_preferences
```

### 3. **Testing Migrations Locally**

```bash
# Reset database and apply all migrations
npx prisma migrate reset

# Or just apply pending migrations
npx prisma migrate deploy
```

### 4. **Deploying to Production**

```bash
# 1. Commit your changes
git add .
git commit -m "feat: add user preferences table"

# 2. Push to main branch
git push origin main

# 3. GitHub Actions will automatically:
#    - Run tests
#    - Build application
#    - Deploy to server
#    - Run migrations (npm run prisma:migrate)
#    - Restart application
```

## 🔄 Current Deployment Process

The GitHub Actions workflow automatically:

1. **Pulls latest code** from main branch
2. **Installs dependencies**
3. **Generates Prisma client** (`npm run prisma:generate`)
4. **Runs migrations** (`npm run prisma:migrate`) ⭐ **This is the key step!**
5. **Builds application** (`npm run build`)
6. **Deploys and restarts** the application

## 🚨 Emergency Migration Fix

If production is broken due to missing migrations:

```bash
# SSH into production server
ssh -i ~/.ssh/id_rsa_marinaobuv ubuntu@158.160.143.162

# Navigate to app directory
cd /var/www/marinaobuv/web

# Set environment and run migrations
export DATABASE_URL="postgresql://marinaobuv_user:marinaobuv_password@localhost:5432/marinaobuv"
npx prisma migrate deploy

# Restart application
pm2 restart marinaobuv
```

## 📋 Migration Checklist

Before pushing schema changes:

- [ ] ✅ Schema changes are tested locally
- [ ] ✅ Migration file is generated
- [ ] ✅ Local database works with new schema
- [ ] ✅ All tests pass
- [ ] ✅ Code is committed and ready to push
- [ ] ✅ Ready to deploy to production

## 🛡️ Safety Measures

### 1. **Always Test Migrations Locally First**

```bash
# Reset local database and test
npx prisma migrate reset
npm run dev
# Test your application thoroughly
```

### 2. **Backup Production Database** (for major changes)

```bash
# Create backup before major migrations
pg_dump -h localhost -U marinaobuv_user marinaobuv > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. **Monitor Deployment**

- Check GitHub Actions logs
- Monitor production logs: `npm run server:logs`
- Test the application after deployment

## 🔍 Troubleshooting

### Migration Fails in Production

1. Check GitHub Actions logs
2. SSH into server and check database connection
3. Manually run migrations if needed
4. Check PM2 logs for application errors

### Schema Out of Sync

1. Check migration status: `npx prisma migrate status`
2. Apply pending migrations: `npx prisma migrate deploy`
3. Regenerate Prisma client: `npx prisma generate`

## 📞 Emergency Contacts

If production is down due to migration issues:

1. **Immediate fix**: SSH into server and run migrations manually
2. **Rollback**: Revert to previous commit if needed
3. **Database restore**: Use backup if migration corrupted data

---

## 🎯 Key Takeaways

1. **Migrations run automatically** on every deployment to main
2. **Always test locally** before pushing
3. **Monitor deployment** logs for issues
4. **Keep migrations small** and focused
5. **Have a rollback plan** for major changes

**Remember**: The deployment process is already configured correctly. The issue was that the migrations weren't pushed to production yet!
