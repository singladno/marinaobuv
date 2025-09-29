#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { prisma } from '../lib/db-node';

/**
 * View draft products and their details
 */
async function viewDraftProducts() {
  try {
    console.log('Fetching draft products...\n');

    const draftProducts = await prisma.waDraftProduct.findMany({
      include: {
        provider: true,
        message: {
          select: {
            id: true,
            from: true,
            fromName: true,
            text: true,
            createdAt: true,
          },
        },
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    console.log(`Found ${draftProducts.length} draft products:\n`);

    draftProducts.forEach((draft, index) => {
      console.log(`--- Draft Product ${index + 1} ---`);
      console.log(`ID: ${draft.id}`);
      console.log(`Name: ${draft.name}`);
      console.log(`Provider: ${draft.provider.name} (${draft.provider.phone})`);
      console.log(
        `Price: ${draft.pricePair ? draft.pricePair.toFixed(2) : 'N/A'} ${draft.currency}`
      );
      console.log(`Pack: N/A pairs`);
      console.log(`Material: ${draft.material || 'N/A'}`);
      console.log(`Gender: ${draft.gender || 'N/A'}`);
      console.log(`Season: ${draft.season || 'N/A'}`);
      console.log(`Status: ${draft.status}`);
      console.log(`Created: ${draft.createdAt}`);

      if (draft.description) {
        console.log(`Description: ${draft.description.substring(0, 100)}...`);
      }

      if (draft.sizes) {
        console.log(`Sizes: ${JSON.stringify(draft.sizes)}`);
      }

      if (draft.images.length > 0) {
        console.log(
          `Images: ${draft.images.length} (${draft.images.map(img => img.url).join(', ')})`
        );
      }

      console.log(`Message: ${draft.message.text?.substring(0, 100)}...`);
      console.log('');
    });

    // Show statistics
    const stats = await prisma.waDraftProduct.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log('--- Statistics ---');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count.id}`);
    });
  } catch (error) {
    console.error('Error viewing draft products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewDraftProducts();
