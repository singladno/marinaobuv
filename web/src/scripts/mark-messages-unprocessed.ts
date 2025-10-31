import { prisma } from '../lib/db-node';
import { env } from '../lib/env';

/**
 * Script to mark messages as unprocessed
 * This resets the processed flag and clears AI-related fields
 */
async function markMessagesUnprocessed(options: {
  targetGroupId?: string;
  messageType?: string[];
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  dryRun?: boolean;
}) {
  const {
    targetGroupId,
    messageType = ['textMessage', 'imageMessage', 'extendedTextMessage'],
    fromDate,
    toDate,
    limit,
    dryRun = false,
  } = options;

  console.log('🔄 Marking messages as unprocessed...\n');

  try {
    // Build where clause to find ALL messages to reset
    // Reset all messages of the specified types, regardless of processed status
    const whereClause: any = {
      type: { in: messageType },
    };

    if (targetGroupId) {
      whereClause.chatId = targetGroupId;
    }

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt.gte = fromDate;
      if (toDate) whereClause.createdAt.lte = toDate;
    }

    // First, count how many messages will be affected
    const totalCount = await prisma.whatsAppMessage.count({
      where: whereClause,
    });

    console.log(`📊 Found ${totalCount} messages to reset`);

    if (totalCount === 0) {
      console.log('✅ No messages found to reset');
      return;
    }

    if (dryRun) {
      console.log('🔍 DRY RUN - No changes will be made');
      console.log(`   Would reset ${totalCount} messages`);
      return;
    }

    // Get message IDs to reset (with limit if specified)
    const messagesToReset = await prisma.whatsAppMessage.findMany({
      where: whereClause,
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: limit }),
    });

    const messageIds = messagesToReset.map(m => m.id);
    const actualCount = messageIds.length;

    console.log(`🔄 Resetting ${actualCount} messages...`);

    // Reset messages in batches to avoid memory issues
    const batchSize = 1000;
    let processedCount = 0;

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);

      await prisma.whatsAppMessage.updateMany({
        where: { id: { in: batch } },
        data: {
          processed: false,
          aiGroupId: null,
          draftProductId: null,
        },
      });

      processedCount += batch.length;
      console.log(
        `   ✅ Reset batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messageIds.length / batchSize)} (${batch.length} messages)`
      );
    }

    console.log(
      `\n🎉 Successfully reset ${processedCount} messages to unprocessed status`
    );
    console.log(`   📊 Total found: ${totalCount}`);
    console.log(`   🔄 Actually reset: ${processedCount}`);
    if (limit && actualCount < totalCount) {
      console.log(
        `   ⚠️  Limited to ${limit} messages (${totalCount - actualCount} remaining)`
      );
    }
  } catch (error) {
    console.error('❌ Error marking messages as unprocessed:', error);
    throw error;
  }
}

/**
 * Main function with command line argument parsing
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const options: any = {
    dryRun: args.includes('--dry-run'),
  };

  // Parse target group ID
  const groupIndex = args.indexOf('--group');
  if (groupIndex !== -1 && args[groupIndex + 1]) {
    options.targetGroupId = args[groupIndex + 1];
  } else if (env.TARGET_GROUP_ID) {
    options.targetGroupId = env.TARGET_GROUP_ID;
  }

  // Parse date range
  const fromDateIndex = args.indexOf('--from');
  if (fromDateIndex !== -1 && args[fromDateIndex + 1]) {
    options.fromDate = new Date(args[fromDateIndex + 1]);
  }

  const toDateIndex = args.indexOf('--to');
  if (toDateIndex !== -1 && args[toDateIndex + 1]) {
    options.toDate = new Date(args[toDateIndex + 1]);
  }

  // Parse limit
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1]);
  }

  // Parse message types
  const typeIndex = args.indexOf('--types');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    options.messageType = args[typeIndex + 1].split(',');
  }

  console.log('🚀 Mark Messages Unprocessed Script\n');
  console.log('Options:');
  console.log(`   Target Group: ${options.targetGroupId || 'all groups'}`);
  console.log(
    `   Message Types: ${options.messageType?.join(', ') || 'textMessage,imageMessage,extendedTextMessage'}`
  );
  console.log(`   From Date: ${options.fromDate?.toISOString() || 'all time'}`);
  console.log(`   To Date: ${options.toDate?.toISOString() || 'all time'}`);
  console.log(`   Limit: ${options.limit || 'no limit'}`);
  console.log(`   Dry Run: ${options.dryRun ? 'YES' : 'NO'}\n`);

  await markMessagesUnprocessed(options);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { markMessagesUnprocessed };
