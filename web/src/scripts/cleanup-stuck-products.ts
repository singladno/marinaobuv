#!/usr/bin/env tsx

/**
 * Cleanup script for products stuck in processing state
 * This script finds and deletes products that are:
 * - Stuck in processing state with no images
 * - Have been processing for too long
 * - Are invalid and should be cleaned up
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StuckProduct {
  id: string;
  name: string;
  createdAt: Date;
  batchProcessingStatus: string | null;
  imageCount: number;
  isActive: boolean;
}

async function findStuckProducts(): Promise<StuckProduct[]> {
  console.log('🔍 Searching for stuck products...');

  // Find products that are stuck in processing
  const stuckProducts = await prisma.product.findMany({
    where: {
      OR: [
        // Products with "Processing..." name that are old
        {
          name: 'Processing...',
          createdAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          },
        },
        // Products with processing status that are old
        {
          batchProcessingStatus: {
            in: ['pending', 'processing'],
          },
          createdAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          },
        },
        // Products with no images that are old
        {
          images: {
            none: {},
          },
          createdAt: {
            lt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          },
        },
      ],
    },
    include: {
      images: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return stuckProducts.map(product => ({
    id: product.id,
    name: product.name,
    createdAt: product.createdAt,
    batchProcessingStatus: product.batchProcessingStatus,
    imageCount: product.images.length,
    isActive: product.isActive,
  }));
}

async function cleanupStuckProducts(): Promise<void> {
  try {
    console.log('🧹 Starting cleanup of stuck products...');

    const stuckProducts = await findStuckProducts();

    if (stuckProducts.length === 0) {
      console.log('✅ No stuck products found');
      return;
    }

    console.log(`🔍 Found ${stuckProducts.length} stuck products:`);
    stuckProducts.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.id} - "${product.name}" (${product.imageCount} images, status: ${product.batchProcessingStatus}, active: ${product.isActive})`
      );
    });

    let deletedCount = 0;
    let errorCount = 0;

    for (const product of stuckProducts) {
      try {
        console.log(
          `🗑️ Deleting stuck product: ${product.id} (${product.name})`
        );

        // Delete associated images first
        const deletedImages = await prisma.productImage.deleteMany({
          where: { productId: product.id },
        });
        console.log(`  ✅ Deleted ${deletedImages.count} product images`);

        // Delete the product
        await prisma.product.delete({
          where: { id: product.id },
        });

        console.log(`  ✅ Deleted stuck product: ${product.id}`);
        deletedCount++;
      } catch (error) {
        console.error(`  ❌ Error deleting product ${product.id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Cleanup completed:`);
    console.log(`  ✅ Successfully deleted: ${deletedCount} products`);
    console.log(`  ❌ Errors: ${errorCount} products`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function main() {
  try {
    await cleanupStuckProducts();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupStuckProducts, findStuckProducts };
