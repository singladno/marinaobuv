#!/usr/bin/env tsx

import { prisma } from '../lib/db-node';

/**
 * Clear all data: messages, draft products, and products
 * This script safely clears all data in the correct order to avoid foreign key constraints
 */
async function clearAllData() {
  try {
    console.log('Starting to clear all data...');
    console.log('This will clear:');
    console.log('- WhatsApp messages');
    console.log('- Draft products and images');
    console.log('- Products and product images');
    console.log('');

    // Step 1: Clear draft product images first (due to foreign key constraints)
    console.log('Clearing draft product images...');
    const draftImageCount = await prisma.waDraftProductImage.count();
    await prisma.waDraftProductImage.deleteMany();
    console.log(`✓ Deleted ${draftImageCount} draft product images`);

    // Step 2: Clear draft products
    console.log('Clearing draft products...');
    const draftProductCount = await prisma.waDraftProduct.count();
    await prisma.waDraftProduct.deleteMany();
    console.log(`✓ Deleted ${draftProductCount} draft products`);

    // Step 3: Clear product images (if they exist)
    console.log('Clearing product images...');
    try {
      const productImageCount = await prisma.productImage.count();
      await prisma.productImage.deleteMany();
      console.log(`✓ Deleted ${productImageCount} product images`);
    } catch {
      console.log('No product images table found or already empty');
    }

    // Step 4: Clear products
    console.log('Clearing products...');
    try {
      const productCount = await prisma.product.count();
      await prisma.product.deleteMany();
      console.log(`✓ Deleted ${productCount} products`);
    } catch {
      console.log('No products table found or already empty');
    }

    // Step 5: Clear WhatsApp messages
    console.log('Clearing WhatsApp messages...');
    const messageCount = await prisma.whatsAppMessage.count();
    await prisma.whatsAppMessage.deleteMany();
    console.log(`✓ Deleted ${messageCount} WhatsApp messages`);

    // Step 6: Clear providers (optional - you might want to keep them)
    console.log('Clearing providers...');
    const providerCount = await prisma.provider.count();
    await prisma.provider.deleteMany();
    console.log(`✓ Deleted ${providerCount} providers`);

    console.log('');
    console.log('✅ All data cleared successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`- Draft product images: ${draftImageCount}`);
    console.log(`- Draft products: ${draftProductCount}`);
    console.log(`- WhatsApp messages: ${messageCount}`);
    console.log(`- Providers: ${providerCount}`);
    console.log('');
    console.log(
      'You can now run the new unified genWA script to process fresh data.'
    );
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  clearAllData();
}
