# Parsing Process Prevention Guide

This guide explains the comprehensive measures implemented to prevent stuck parsing records and ensure system reliability.

## 🛡️ Preventive Measures Implemented

### 1. **Automatic Cleanup in Hourly Cron**

- **Location**: `src/scripts/hourly-cron.ts`
- **Function**: `cleanupStuckProcesses()`
- **Triggers**: Before every parsing run
- **Actions**:
  - Cleans up processes running >1 hour
  - Cleans up processes running >2 hours (very old)
  - Limits concurrent processes to 3 maximum
  - Provides detailed error messages

### 2. **Signal Handlers for Graceful Shutdown**

- **Location**: `src/lib/services/parsing-signal-handler.ts`
- **Handles**: SIGTERM, SIGINT, uncaught exceptions, unhandled rejections
- **Actions**:
  - Updates parsing status to "failed" on interruption
  - Provides specific error messages for different signal types
  - Ensures database consistency

### 3. **Timeout Protection**

- **Location**: `src/scripts/hourly-cron.ts`
- **Timeouts**:
  - Message fetching: 5 minutes
  - Product processing: 30 minutes
- **Actions**:
  - Automatically kills processes that exceed timeouts
  - Updates status to "failed" with timeout error

### 4. **Health Check System**

- **Location**: `src/scripts/parsing-health-check.ts`
- **Purpose**: Standalone health monitoring
- **Features**:
  - Detects stuck processes (>1 hour)
  - Cleans up very old processes (>2 hours)
  - Monitors concurrent process limits
  - Generates alerts for system issues

### 5. **Monitoring Script**

- **Location**: `src/scripts/parsing-monitor.ts`
- **Purpose**: Regular system monitoring
- **Features**:
  - Runs health checks automatically
  - Provides system statistics
  - Can be scheduled as cron job

## 🔧 How to Use

### Manual Health Check

```bash
cd web
npx tsx src/scripts/parsing-health-check.ts
```

### System Monitoring

```bash
cd web
npx tsx src/scripts/parsing-monitor.ts
```

### Manual Cleanup (if needed)

```bash
cd web
npx tsx -e "
import { prisma } from './src/lib/db-node';
const stuck = await prisma.parsingHistory.findMany({ where: { status: 'running' } });
console.log('Stuck processes:', stuck.length);
"
```

## 📅 Recommended Cron Schedule

Add these to your crontab for optimal monitoring:

```bash
# Health check every 5 minutes
*/5 * * * * cd /path/to/marinaobuv/web && npx tsx src/scripts/parsing-health-check.ts

# System monitor every 10 minutes
*/10 * * * * cd /path/to/marinaobuv/web && npx tsx src/scripts/parsing-monitor.ts

# Full cleanup every hour (in addition to built-in cleanup)
0 * * * * cd /path/to/marinaobuv/web && npx tsx src/scripts/parsing-health-check.ts
```

## 🚨 Alert Conditions

The system will generate alerts for:

1. **Stuck Processes**: >1 hour running
2. **Very Old Processes**: >2 hours running
3. **Too Many Concurrent**: >3 processes running
4. **System Overload**: >5 processes running

## 🔍 Monitoring Commands

### Check Current Status

```bash
# Check running processes
npx tsx -e "
import { prisma } from './src/lib/db-node';
const running = await prisma.parsingHistory.findMany({
  where: { status: 'running' },
  orderBy: { startedAt: 'desc' }
});
console.log('Running processes:', running.length);
running.forEach(p => console.log(\`- \${p.id}: \${p.startedAt}\`));
"
```

### Check Recent Activity

```bash
# Check last 24 hours
npx tsx -e "
import { prisma } from './src/lib/db-node';
const recent = await prisma.parsingHistory.findMany({
  where: { startedAt: { gte: new Date(Date.now() - 24*60*60*1000) } },
  orderBy: { startedAt: 'desc' },
  take: 10
});
recent.forEach(p => console.log(\`\${p.startedAt}: \${p.status} (\${p.messagesRead} msgs, \${p.productsCreated} products)\`));
"
```

## 🛠️ Troubleshooting

### If Processes Still Get Stuck

1. **Check for system resource issues**:

   ```bash
   # Check memory usage
   free -h

   # Check disk space
   df -h

   # Check running processes
   ps aux | grep tsx
   ```

2. **Check database connections**:

   ```bash
   # Check if database is accessible
   npx tsx -e "import { prisma } from './src/lib/db-node'; prisma.\$connect().then(() => console.log('DB OK')).catch(console.error);"
   ```

3. **Manual cleanup**:
   ```bash
   # Force cleanup all running processes
   npx tsx -e "
   import { prisma } from './src/lib/db-node';
   await prisma.parsingHistory.updateMany({
     where: { status: 'running' },
     data: {
       status: 'failed',
       completedAt: new Date(),
       errorMessage: 'Manual cleanup'
     }
   });
   console.log('Cleanup complete');
   "
   ```

## 📊 System Limits

- **Maximum concurrent processes**: 3
- **Process timeout**: 30 minutes
- **Stuck process threshold**: 1 hour
- **Very old process threshold**: 2 hours
- **Auto-cleanup threshold**: 5 processes

## 🔄 Recovery Procedures

### If System Gets Overloaded

1. **Stop all parsing processes**:

   ```bash
   pkill -f "tsx.*parsing"
   ```

2. **Clean up database**:

   ```bash
   npx tsx src/scripts/parsing-health-check.ts
   ```

3. **Restart system**:
   ```bash
   # Restart the application
   npm run dev
   ```

### If Database Gets Corrupted

1. **Check database status**:

   ```bash
   npx prisma db push
   ```

2. **Reset parsing history** (if needed):
   ```bash
   npx tsx -e "
   import { prisma } from './src/lib/db-node';
   await prisma.parsingHistory.deleteMany({});
   console.log('Parsing history cleared');
   "
   ```

## ✅ Best Practices

1. **Always run health checks** before starting new parsing
2. **Monitor system resources** during heavy processing
3. **Use timeouts** for all external API calls
4. **Implement graceful shutdown** for all processes
5. **Log all errors** with detailed context
6. **Set up alerts** for system issues
7. **Regular maintenance** of old records

## 🎯 Success Metrics

- **Zero stuck processes** in production
- **<1% failure rate** for parsing operations
- **<5 minute recovery time** from stuck processes
- **100% cleanup success** for interrupted processes
