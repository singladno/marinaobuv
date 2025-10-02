# 🚀 Deployment with Parsing Cron Setup

## ✅ **Changes Made**

### **1. Parallel Execution**

- ✅ **Removed blocking logic** - New runs no longer skip if others are running
- ✅ **Multiple parsers can run simultaneously** - Each tracks its own progress
- ✅ **Independent execution** - No interference between parallel runs

### **2. Automatic Deployment Setup**

- ✅ **Integrated into `deploy-pm2.sh`** - Cron setup runs automatically on deploy
- ✅ **GitHub Actions workflow** - Automated deployment with cron setup
- ✅ **Quick deploy script** - Includes cron setup in updates

## 🔧 **How It Works**

### **Parallel Execution**

```bash
# Multiple cron jobs can run simultaneously
# Each creates its own ParsingHistory record
# No blocking or skipping of new runs
```

### **Automatic Deployment**

```bash
# On server deployment:
./deploy-pm2.sh
# ✅ Automatically sets up cron job

# On code updates:
cd /var/www/marinaobuv
./deploy.sh
# ✅ Updates cron job configuration
```

### **GitHub Actions**

```yaml
# Automatic deployment on push to main
# Includes cron setup in deployment process
# Verifies cron job is configured
```

## 📋 **Deployment Steps**

### **1. Initial Server Setup**

```bash
# Run the main deployment script
./deploy-pm2.sh
```

This will:

- Set up the entire application
- Configure PM2 and Nginx
- **Automatically set up the parsing cron job**
- Verify everything is working

### **2. Code Updates**

```bash
# On the server, run:
cd /var/www/marinaobuv
./deploy.sh
```

This will:

- Pull latest code
- Install dependencies
- Run migrations
- **Update cron job configuration**
- Restart the application

### **3. GitHub Actions (Automatic)**

When you push to `main` branch:

- ✅ Automatically deploys to server
- ✅ Sets up/updates cron job
- ✅ Verifies deployment success

## 🎯 **Cron Job Configuration**

### **What Gets Set Up**

```bash
# Cron job runs every hour at minute 0
0 * * * * cd /var/www/marinaobuv/web && npx tsx src/scripts/hourly-cron.ts >> logs/parsing-cron.log 2>&1
```

### **Features**

- ✅ **Parallel execution** - Multiple runs can happen simultaneously
- ✅ **Automatic logging** - All output goes to `logs/parsing-cron.log`
- ✅ **Error handling** - Failed runs are tracked in database
- ✅ **Progress tracking** - Each run tracks messages read and products created

## 📊 **Monitoring**

### **Admin Dashboard**

- URL: `https://yourdomain.com/admin/parsing`
- Real-time status of all parsing runs
- Historical data and statistics
- Filter by status (running/completed/failed)

### **Server Monitoring**

```bash
# Check cron job status
crontab -l | grep hourly-cron

# View parsing logs
tail -f /var/www/marinaobuv/web/logs/parsing-cron.log

# Check PM2 status
pm2 status

# Monitor system
/var/www/marinaobuv/monitor.sh
```

## 🔄 **Automatic Deployment Flow**

### **1. Code Push**

```bash
git push origin main
```

### **2. GitHub Actions**

- ✅ Builds the application
- ✅ Deploys to server
- ✅ Sets up cron job
- ✅ Verifies deployment

### **3. Server Updates**

- ✅ Pulls latest code
- ✅ Installs dependencies
- ✅ Runs database migrations
- ✅ Updates cron configuration
- ✅ Restarts application

## 🎉 **Result**

Your parsing system will now:

- ✅ **Run automatically every hour**
- ✅ **Allow parallel execution** (no blocking)
- ✅ **Deploy automatically** when you push code
- ✅ **Track all parsing activity** in the admin dashboard
- ✅ **Handle errors gracefully** with proper logging

The system is fully automated and production-ready! 🚀
