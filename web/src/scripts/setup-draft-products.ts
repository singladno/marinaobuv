#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

/**
 * Setup script to run migrations and prepare for draft product processing
 */
async function setup() {
  try {
    console.log('Setting up draft products system...');

    // Check if Provider table exists
    const providerCount = await prisma.provider.count();
    console.log(`Found ${providerCount} existing providers`);

    // Check if WaDraftProduct table exists
    const draftCount = await prisma.waDraftProduct.count();
    console.log(`Found ${draftCount} existing draft products`);

    // Check messages without providers
    const messagesWithoutProvider = await prisma.whatsAppMessage.count({
      where: {
        providerId: null,
        from: { not: null },
        fromName: { not: null },
        fromMe: false,
      },
    });
    console.log(`Found ${messagesWithoutProvider} messages without providers`);

    // Check messages ready for processing
    const messagesReady = await prisma.whatsAppMessage.count({
      where: {
        providerId: { not: null },
        text: { not: null },
        fromMe: false,
        draftProduct: null,
      },
    });
    console.log(
      `Found ${messagesReady} messages ready for draft product processing`
    );

    console.log('\nSetup complete! You can now run:');
    console.log('npx tsx src/scripts/process-draft-products.ts');
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setup();
