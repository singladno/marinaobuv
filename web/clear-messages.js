const { PrismaClient } = require('@prisma/client');

async function clearMessages() {
  const prisma = new PrismaClient();

  try {
    console.log('Clearing WhatsApp messages table...');

    // Count messages before deletion
    const countBefore = await prisma.whatsAppMessage.count();
    console.log(`Found ${countBefore} messages to delete`);

    if (countBefore === 0) {
      console.log('No messages to clear.');
      return;
    }

    // Delete all messages
    const result = await prisma.whatsAppMessage.deleteMany({});

    console.log(`Successfully deleted ${result.count} messages`);

    // Verify deletion
    const countAfter = await prisma.whatsAppMessage.count();
    console.log(`Messages remaining: ${countAfter}`);

  } catch (error) {
    console.error('Error clearing messages:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearMessages();
