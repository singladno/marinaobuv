# Parsing Cron Setup Guide

This guide explains how to set up the parsing monitoring system on your production server.

## 🚀 Server Setup

### 1. Environment Variables

The cron script will automatically load environment variables from `.env.local`. Make sure your server has the correct database URL:

```bash
# In your .env.local file on the server
DATABASE_URL="postgresql://username:password@host:port/database"
```

### 2. Install Dependencies

Make sure all dependencies are installed on the server:

```bash
cd /path/to/your/web/directory
npm install
```

### 3. Set Up Cron Job

Run the setup script:

```bash
./src/scripts/setup-server-cron.sh
```

This will:

- Add a cron job that runs every hour
- Create logs directory
- Set up proper logging

### 4. Test the Setup

Test the cron script manually first:

```bash
cd /path/to/your/web/directory
npx tsx src/scripts/hourly-cron.ts
```

Check the logs:

```bash
tail -f logs/parsing-cron.log
```

## 📊 Monitoring

### Admin Dashboard

Access the parsing monitoring dashboard at:

- URL: `https://yourdomain.com/admin/parsing`
- Shows real-time status, history, and statistics

### Log Files

Monitor the cron execution:

```bash
# View recent logs
tail -f logs/parsing-cron.log

# View all logs
cat logs/parsing-cron.log
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check if DATABASE_URL is correct in `.env.local`
   - Verify database server is running
   - Test connection: `npx tsx src/scripts/test-parsing-monitoring.ts`

2. **Permission Issues**
   - Make sure the script has write permissions to the logs directory
   - Check file permissions: `ls -la src/scripts/`

3. **Cron Not Running**
   - Check if cron service is running: `systemctl status cron`
   - View crontab: `crontab -l`
   - Check system logs: `journalctl -u cron`

### Manual Testing

Test individual components:

```bash
# Test database connection
npx tsx src/scripts/test-parsing-monitoring.ts

# Test message fetching
npx tsx src/scripts/fetch-recent-messages.ts

# Test product processing
npx tsx src/scripts/process-draft-products-unified.ts
```

## 📈 Performance Monitoring

The system tracks:

- **Messages Read**: Number of WhatsApp messages processed
- **Products Created**: Number of draft products created
- **Duration**: Time taken for each parsing run
- **Status**: Running, Completed, or Failed

Monitor these metrics in the admin dashboard to ensure optimal performance.

## 🔄 Maintenance

### Regular Tasks

1. **Check Logs Weekly**

   ```bash
   tail -n 100 logs/parsing-cron.log
   ```

2. **Monitor Database Growth**
   - Check parsing history table size
   - Archive old records if needed

3. **Update Dependencies**
   ```bash
   npm update
   ```

### Backup Considerations

- The parsing history is stored in the database
- Consider backing up the `ParsingHistory` table
- Log files are stored in `logs/parsing-cron.log`

## 🚨 Alerts

Set up monitoring for:

- Failed parsing runs
- Long-running processes (>2 hours)
- Database connection issues
- High error rates

The admin dashboard provides real-time alerts for these issues.
