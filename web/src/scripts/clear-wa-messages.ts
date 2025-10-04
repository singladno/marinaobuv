#!/usr/bin/env tsx

import './load-env';
import { prisma } from '../lib/db-node';

async function clearWhatsAppMessages() {
  try {
    console.log('🗑️  Clearing all WhatsApp messages...');

    // Clear all WhatsApp messages
    const result = await prisma.whatsAppMessage.deleteMany({});

    console.log(`✅ Cleared ${result.count} WhatsApp messages`);

    // Also clear any draft products that might be orphaned
    const draftResult = await prisma.waDraftProduct.deleteMany({});
    console.log(`✅ Cleared ${draftResult.count} draft products`);

    // Clear parsing history
    const parsingResult = await prisma.parsingHistory.deleteMany({});
    console.log(`✅ Cleared ${parsingResult.count} parsing history records`);

    console.log('🎉 All WhatsApp messages and related data cleared!');
  } catch (error) {
    console.error('❌ Error clearing messages:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearWhatsAppMessages();
