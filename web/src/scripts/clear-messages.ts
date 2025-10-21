#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

async function main() {
  try {
    console.log('Clearing WhatsApp messages and related drafts...');

    // Delete draft images first (defensive, though WaDraftProduct has CASCADE to images)
    const delImages = await prisma.waDraftProductImage.deleteMany({});
    console.log(`Deleted WaDraftProductImage: ${delImages.count}`);

    // Delete drafts (defensive, though WhatsAppMessage->WaDraftProduct is CASCADE)
    const delDrafts = await prisma.waDraftProduct.deleteMany({});
    console.log(`Deleted WaDraftProduct: ${delDrafts.count}`);

    // Delete messages
    const delMessages = await prisma.whatsAppMessage.deleteMany({});
    console.log(`Deleted WhatsAppMessage: ${delMessages.count}`);

    console.log('Done.');
  } catch (e) {
    console.error('Failed to clear messages:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
