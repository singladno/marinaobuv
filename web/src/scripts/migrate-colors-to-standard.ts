#!/usr/bin/env tsx

/**
 * Migration script to normalize all existing colors in the database to standardized colors
 * This should be run once to update all existing color data
 */

import './load-env';
import { prisma } from '../lib/db-node';
import { normalizeToStandardColor } from '../lib/constants/colors';

interface ColorUpdate {
  table: string;
  id: string;
  oldColor: string | null;
  newColor: string | null;
}

async function migrateColors() {
  console.log('🔄 Starting color normalization migration...\n');

  const updates: ColorUpdate[] = [];
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNullified = 0;

  try {
    // 1. Migrate ProductImage colors
    console.log('📸 Migrating ProductImage colors...');
    const productImages = await prisma.productImage.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        id: true,
        color: true,
      },
    });

    for (const image of productImages) {
      if (!image.color) continue;

      const normalized = normalizeToStandardColor(image.color);

      if (normalized === null) {
        // Color cannot be normalized - set to null
        await prisma.productImage.update({
          where: { id: image.id },
          data: { color: null },
        });
        updates.push({
          table: 'ProductImage',
          id: image.id,
          oldColor: image.color,
          newColor: null,
        });
        totalNullified++;
      } else if (normalized.toLowerCase() !== image.color.toLowerCase()) {
        // Color needs normalization
        await prisma.productImage.update({
          where: { id: image.id },
          data: { color: normalized },
        });
        updates.push({
          table: 'ProductImage',
          id: image.id,
          oldColor: image.color,
          newColor: normalized,
        });
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    console.log(`   ✅ ProductImage: ${totalUpdated} updated, ${totalSkipped} already correct, ${totalNullified} nullified\n`);

    // Reset counters for next table
    let tableUpdated = totalUpdated;
    let tableSkipped = totalSkipped;
    let tableNullified = totalNullified;
    totalUpdated = 0;
    totalSkipped = 0;
    totalNullified = 0;

    // 2. Migrate WaDraftProductImage colors
    console.log('📸 Migrating WaDraftProductImage colors...');
    const draftImages = await prisma.waDraftProductImage.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        id: true,
        color: true,
      },
    });

    for (const image of draftImages) {
      if (!image.color) continue;

      const normalized = normalizeToStandardColor(image.color);

      if (normalized === null) {
        await prisma.waDraftProductImage.update({
          where: { id: image.id },
          data: { color: null },
        });
        updates.push({
          table: 'WaDraftProductImage',
          id: image.id,
          oldColor: image.color,
          newColor: null,
        });
        totalNullified++;
      } else if (normalized.toLowerCase() !== image.color.toLowerCase()) {
        await prisma.waDraftProductImage.update({
          where: { id: image.id },
          data: { color: normalized },
        });
        updates.push({
          table: 'WaDraftProductImage',
          id: image.id,
          oldColor: image.color,
          newColor: normalized,
        });
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    console.log(`   ✅ WaDraftProductImage: ${totalUpdated} updated, ${totalSkipped} already correct, ${totalNullified} nullified\n`);

    tableUpdated += totalUpdated;
    tableSkipped += totalSkipped;
    tableNullified += totalNullified;
    totalUpdated = 0;
    totalSkipped = 0;
    totalNullified = 0;

    // 3. Migrate WaDraftProduct colors
    console.log('📦 Migrating WaDraftProduct colors...');
    const draftProducts = await prisma.waDraftProduct.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        id: true,
        color: true,
      },
    });

    for (const draft of draftProducts) {
      if (!draft.color) continue;

      const normalized = normalizeToStandardColor(draft.color);

      if (normalized === null) {
        await prisma.waDraftProduct.update({
          where: { id: draft.id },
          data: { color: null },
        });
        updates.push({
          table: 'WaDraftProduct',
          id: draft.id,
          oldColor: draft.color,
          newColor: null,
        });
        totalNullified++;
      } else if (normalized.toLowerCase() !== draft.color.toLowerCase()) {
        await prisma.waDraftProduct.update({
          where: { id: draft.id },
          data: { color: normalized },
        });
        updates.push({
          table: 'WaDraftProduct',
          id: draft.id,
          oldColor: draft.color,
          newColor: normalized,
        });
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    console.log(`   ✅ WaDraftProduct: ${totalUpdated} updated, ${totalSkipped} already correct, ${totalNullified} nullified\n`);

    tableUpdated += totalUpdated;
    tableSkipped += totalSkipped;
    tableNullified += totalNullified;
    totalUpdated = 0;
    totalSkipped = 0;
    totalNullified = 0;

    // 4. Migrate OrderItem colors
    console.log('🛒 Migrating OrderItem colors...');
    const orderItems = await prisma.orderItem.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        id: true,
        color: true,
      },
    });

    for (const item of orderItems) {
      if (!item.color) continue;

      const normalized = normalizeToStandardColor(item.color);

      if (normalized === null) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { color: null },
        });
        updates.push({
          table: 'OrderItem',
          id: item.id,
          oldColor: item.color,
          newColor: null,
        });
        totalNullified++;
      } else if (normalized.toLowerCase() !== item.color.toLowerCase()) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { color: normalized },
        });
        updates.push({
          table: 'OrderItem',
          id: item.id,
          oldColor: item.color,
          newColor: normalized,
        });
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    console.log(`   ✅ OrderItem: ${totalUpdated} updated, ${totalSkipped} already correct, ${totalNullified} nullified\n`);

    tableUpdated += totalUpdated;
    tableSkipped += totalSkipped;
    tableNullified += totalNullified;
    totalUpdated = 0;
    totalSkipped = 0;
    totalNullified = 0;

    // 5. Migrate PurchaseItem colors
    console.log('💰 Migrating PurchaseItem colors...');
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        id: true,
        color: true,
      },
    });

    for (const item of purchaseItems) {
      if (!item.color) continue;

      const normalized = normalizeToStandardColor(item.color);

      if (normalized === null) {
        await prisma.purchaseItem.update({
          where: { id: item.id },
          data: { color: null },
        });
        updates.push({
          table: 'PurchaseItem',
          id: item.id,
          oldColor: item.color,
          newColor: null,
        });
        totalNullified++;
      } else if (normalized.toLowerCase() !== item.color.toLowerCase()) {
        await prisma.purchaseItem.update({
          where: { id: item.id },
          data: { color: normalized },
        });
        updates.push({
          table: 'PurchaseItem',
          id: item.id,
          oldColor: item.color,
          newColor: normalized,
        });
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    console.log(`   ✅ PurchaseItem: ${totalUpdated} updated, ${totalSkipped} already correct, ${totalNullified} nullified\n`);

    tableUpdated += totalUpdated;
    tableSkipped += totalSkipped;
    tableNullified += totalNullified;

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Total updated: ${tableUpdated}`);
    console.log(`   ⏭️  Total already correct: ${tableSkipped}`);
    console.log(`   ❌ Total nullified (invalid colors): ${tableNullified}`);
    console.log(`   📝 Total records processed: ${tableUpdated + tableSkipped + tableNullified}`);

    // Show some examples of changes
    if (updates.length > 0) {
      console.log('\n📋 Sample changes (first 10):');
      updates.slice(0, 10).forEach(update => {
        console.log(
          `   ${update.table}[${update.id}]: "${update.oldColor}" → ${update.newColor ? `"${update.newColor}"` : 'null'}`
        );
      });
      if (updates.length > 10) {
        console.log(`   ... and ${updates.length - 10} more changes`);
      }
    }

    console.log('\n✅ Color normalization migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateColors();
