import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
  try {
    console.log('Verifying WhatsApp messages import...\n');

    // Get total count
    const totalCount = await prisma.whatsAppMessage.count();
    console.log(`Total messages in database: ${totalCount}`);

    // Get count by type
    const typeCounts = await prisma.whatsAppMessage.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    console.log('\nMessages by type:');
    typeCounts.forEach(({ type, _count }) => {
      console.log(`  ${type || 'null'}: ${_count.type}`);
    });

    // Get count by chat
    const chatCounts = await prisma.whatsAppMessage.groupBy({
      by: ['chatId'],
      _count: {
        chatId: true,
      },
      orderBy: {
        _count: {
          chatId: 'desc',
        },
      },
      take: 5,
    });

    console.log('\nTop 5 chats by message count:');
    chatCounts.forEach(({ chatId, _count }) => {
      console.log(`  ${chatId}: ${_count.chatId} messages`);
    });

    // Get date range
    const dateRange = await prisma.whatsAppMessage.aggregate({
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    });

    console.log('\nDate range:');
    console.log(`  Earliest: ${dateRange._min.createdAt}`);
    console.log(`  Latest: ${dateRange._max.createdAt}`);

    // Get some sample messages
    const sampleMessages = await prisma.whatsAppMessage.findMany({
      take: 3,
      select: {
        id: true,
        waMessageId: true,
        type: true,
        text: true,
        from: true,
        createdAt: true,
      },
    });

    console.log('\nSample messages:');
    sampleMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ID: ${msg.id}`);
      console.log(`     WA ID: ${msg.waMessageId}`);
      console.log(`     Type: ${msg.type}`);
      console.log(`     From: ${msg.from}`);
      console.log(
        `     Text: ${msg.text?.substring(0, 50)}${msg.text && msg.text.length > 50 ? '...' : ''}`
      );
      console.log(`     Created: ${msg.createdAt}`);
      console.log('');
    });

    console.log('✅ Verification completed successfully!');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyImport();
