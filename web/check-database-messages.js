// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseMessages() {
  try {
    console.log('🔍 Checking Database Messages');
    console.log('=============================');

    // Get total count
    const totalCount = await prisma.whatsAppMessage.count();
    console.log(`\nTotal messages in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log('No messages found in database');
      return;
    }

    // Get recent messages
    const recentMessages = await prisma.whatsAppMessage.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    console.log(`\nRecent messages (last 10):`);
    recentMessages.forEach((msg, index) => {
      console.log(`\n--- Message ${index + 1} ---`);
      console.log(`ID: ${msg.waMessageId}`);
      console.log(`Type: ${msg.type}`);
      console.log(`From: ${msg.fromName || 'Unknown'}`);
      console.log(`Chat ID: ${msg.chatId}`);
      console.log(
        `Timestamp: ${msg.timestamp ? new Date(Number(msg.timestamp)).toISOString() : 'No timestamp'}`
      );
      console.log(`Text: ${msg.text || 'No text'}`);
      console.log(`From Me: ${msg.fromMe}`);
      console.log(`Processed: ${msg.processed || false}`);
      console.log(`AI Status: ${msg.aiStatus || 'Not set'}`);
    });

    // Check for unprocessed messages
    const unprocessedCount = await prisma.whatsAppMessage.count({
      where: { processed: false },
    });
    console.log(`\nUnprocessed messages: ${unprocessedCount}`);

    // Check for processed messages
    const processedCount = await prisma.whatsAppMessage.count({
      where: { processed: true },
    });
    console.log(`Processed messages: ${processedCount}`);

    // Check by type
    const typeCounts = await prisma.whatsAppMessage.groupBy({
      by: ['type'],
      _count: { type: true },
    });
    console.log(`\nMessages by type:`);
    typeCounts.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type}`);
    });

    // Check by chat ID
    const chatCounts = await prisma.whatsAppMessage.groupBy({
      by: ['chatId'],
      _count: { chatId: true },
    });
    console.log(`\nMessages by chat ID:`);
    chatCounts.forEach(chat => {
      console.log(`  ${chat.chatId}: ${chat._count.chatId}`);
    });
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDatabaseMessages();

  console.log('\n✅ Database check completed!');
}

main().catch(console.error);
