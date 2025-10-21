#!/usr/bin/env tsx

/**
 * Aggressive cleanup script for stuck products
 * This script runs more frequently and catches products that get stuck
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StuckProduct {
  id: string;
  name: string;
  article: string | null;
  createdAt: Date;
  batchProcessingStatus: string | null;
  imageCount: number;
  isActive: boolean;
}

async function findStuckProducts(): Promise<StuckProduct[]> {
  console.log('🔍 Searching for stuck products with aggressive criteria...');

  // More aggressive criteria for stuck products
  const stuckProducts = await prisma.product.findMany({
    where: {
      OR: [
        // Products with "Processing..." name (immediate cleanup)
        {
          name: 'Processing...',
        },
        // Products stuck in pending status (immediate cleanup)
        {
          batchProcessingStatus: 'pending',
        },
        // Products with no images (immediate cleanup)
        {
          images: {
            none: {},
          },
        },
        // Products with "Processing..." name that are old (30 minutes)
        {
          name: 'Processing...',
          createdAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
        // Products with processing status that are old (30 minutes)
        {
          batchProcessingStatus: {
            in: ['pending', 'processing'],
          },
          createdAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
        // Products with no images that are old (15 minutes)
        {
          images: {
            none: {},
          },
          createdAt: {
            lt: new Date(Date.now() - 15 * 60 * 1000),
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
    article: product.article,
    createdAt: product.createdAt,
    batchProcessingStatus: product.batchProcessingStatus,
    imageCount: product.images.length,
    isActive: product.isActive,
  }));
}

async function cleanupStuckProducts(): Promise<void> {
  try {
    console.log('🧹 Starting aggressive cleanup of stuck products...');

    const stuckProducts = await findStuckProducts();

    if (stuckProducts.length === 0) {
      console.log('✅ No stuck products found');
      return;
    }

    console.log(`🔍 Found ${stuckProducts.length} stuck products:`);
    stuckProducts.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.article || 'No article'} - "${product.name}" (${product.imageCount} images, status: ${product.batchProcessingStatus}, active: ${product.isActive})`
      );
    });

    let deletedCount = 0;
    let errorCount = 0;

    for (const product of stuckProducts) {
      try {
        console.log(
          `🗑️ Deleting stuck product: ${product.id} (${product.article || 'No article'})`
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

    console.log(`🎉 Aggressive cleanup completed:`);
    console.log(`  ✅ Successfully deleted: ${deletedCount} products`);
    console.log(`  ❌ Errors: ${errorCount} products`);
  } catch (error) {
    console.error('❌ Error during aggressive cleanup:', error);
    throw error;
  }
}

async function main() {
  try {
    await cleanupStuckProducts();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
