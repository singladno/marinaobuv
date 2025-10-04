# 🚀 MarinaObuv Auto-Startup Guide

This guide explains how to set up automatic startup for MarinaObuv after VM restarts.

## 🎯 **Problem Solved**

After VM restarts, you had to manually:
- Fix PostgreSQL SSL permissions
- Start PostgreSQL database
- Start PM2 application
- Configure parsing cron job

**Now it's all automated!** 🎉

## 📋 **Quick Setup**

### **Option 1: Full Deployment with Auto-Startup**
```bash
# Deploy everything including auto-startup
./scripts/deploy-with-auto-startup.sh
```

### **Option 2: Add Auto-Startup to Existing Deployment**
```bash
# If you already have the app deployed, just add auto-startup
sudo ./scripts/setup-auto-startup.sh
```

## 🔧 **What Gets Automated**

### **1. PostgreSQL SSL Fix**
- Automatically fixes SSL certificate permissions
- Disables SSL to prevent startup issues
- Starts PostgreSQL service

### **2. Application Startup**
- Starts PM2 process manager
- Launches MarinaObuv application
- Waits for application to be ready

### **3. Parsing Configuration**
- Sets up hourly parsing cron job
- Creates necessary log directories
- Configures logging

### **4. Health Monitoring**
- Checks PostgreSQL status
- Verifies application health
- Monitors service status

## 📊 **Service Management**

### **Check Auto-Startup Status**
```bash
sudo systemctl status marinaobuv-startup
```

### **View Auto-Startup Logs**
```bash
sudo journalctl -u marinaobuv-startup -f
```

### **Manual Start (if needed)**
```bash
sudo systemctl start marinaobuv-startup
```

### **Disable Auto-Startup**
```bash
sudo systemctl disable marinaobuv-startup
```

## 🔍 **Monitoring Commands**

### **Application Status**
```bash
pm2 status
pm2 logs marinaobuv
```

### **Database Status**
```bash
sudo systemctl status postgresql@16-main
```

### **Cron Job Status**
```bash
crontab -l | grep hourly-cron
```

### **Health Check**
```bash
curl http://localhost:3000/api/health
```

## 🚨 **Troubleshooting**

### **If Auto-Startup Fails**
```bash
# Check service status
sudo systemctl status marinaobuv-startup

# View detailed logs
sudo journalctl -u marinaobuv-startup --no-pager

# Run startup script manually
./scripts/auto-startup.sh
```

### **Common Issues**

1. **PostgreSQL SSL Error**
   - Auto-startup script fixes this automatically
   - If it persists, check file permissions

2. **Application Not Starting**
   - Check PM2 status: `pm2 status`
   - Check application logs: `pm2 logs marinaobuv`

3. **Cron Job Not Working**
   - Verify cron job: `crontab -l`
   - Check parsing logs: `tail -f /var/www/marinaobuv/web/logs/parsing-cron.log`

## 🎉 **Benefits**

- ✅ **Zero manual intervention** after VM restart
- ✅ **Automatic service recovery**
- ✅ **Consistent startup process**
- ✅ **Health monitoring and status checks**
- ✅ **Error handling and logging**

## 🔄 **How It Works**

1. **VM Restarts** → Systemd starts `marinaobuv-startup.service`
2. **Service runs** → `auto-startup.sh` script executes
3. **PostgreSQL** → SSL fixes applied, database started
4. **Application** → PM2 starts MarinaObuv app
5. **Parsing** → Cron job configured for hourly parsing
6. **Monitoring** → Health checks performed
7. **Complete** → All services running automatically!

Your MarinaObuv application will now start automatically every time you restart your VM! 🚀
