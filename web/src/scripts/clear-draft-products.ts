#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

/**
 * Clear all draft products and their associated images
 */
async function clearDraftProducts(): Promise<void> {
  try {
    console.log('Starting to clear draft products...');

    // First, get count of draft products
    const draftCount = await prisma.waDraftProduct.count();
    console.log(`Found ${draftCount} draft products to delete`);

    if (draftCount === 0) {
      console.log('No draft products found. Nothing to clear.');
      return;
    }

    // Delete all draft product images first (due to foreign key constraints)
    const deletedImages = await prisma.waDraftProductImage.deleteMany({});
    console.log(`Deleted ${deletedImages.count} draft product images`);

    // Delete all draft products
    const deletedDrafts = await prisma.waDraftProduct.deleteMany({});
    console.log(`Deleted ${deletedDrafts.count} draft products`);

    console.log('✅ Successfully cleared all draft products and images');
  } catch (error) {
    console.error('❌ Error clearing draft products:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await clearDraftProducts();
  } catch (error) {
    console.error('Fatal error during draft product clearing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
