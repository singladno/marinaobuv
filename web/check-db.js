import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('📊 Database Status:');

    // Check messages
    const messageCount = await prisma.whatsAppMessage.count();
    console.log(`📨 Total messages: ${messageCount}`);

    // Check providers
    const providers = await prisma.provider.findMany();
    console.log(`🏢 Providers: ${providers.length}`);
    providers.forEach(p => console.log(`  - ${p.id}: ${p.name}`));

    // Check draft products
    const draftCount = await prisma.waDraftProduct.count();
    console.log(`📦 Draft products: ${draftCount}`);

    // Check recent messages with grouping info
    const recentMessages = await prisma.whatsAppMessage.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        text: true,
        mediaUrl: true,
        processed: true,
        aiGroupId: true,
      },
    });

    // Check message types distribution
    const messageTypes = await prisma.whatsAppMessage.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { processed: false },
    });

    console.log('\n📊 Message types:');
    messageTypes.forEach(type => {
      console.log(`  - ${type.type || 'null'}: ${type._count.type}`);
    });

    console.log('\n📋 Recent unprocessed messages:');
    recentMessages.forEach(msg => {
      console.log(
        `  - ${msg.id}: ${msg.text?.substring(0, 50) || 'IMAGE'} [Group: ${msg.aiGroupId || 'none'}]`
      );
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
