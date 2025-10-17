import { PrismaClient } from '@prisma/client';

import { generateItemCode } from '../lib/itemCodeGenerator';

const prisma = new PrismaClient();

async function populateItemCodes() {
  try {
    console.log('🔍 Finding order items without item codes...');

    // Find all order items that don't have item codes
    const itemsWithoutCodes = await prisma.orderItem.findMany({
      where: {
        itemCode: null,
      },
      select: {
        id: true,
        name: true,
        orderId: true,
      },
    });

    console.log(`📦 Found ${itemsWithoutCodes.length} items without codes`);

    if (itemsWithoutCodes.length === 0) {
      console.log('✅ All items already have codes!');
      return;
    }

    // Generate unique codes for all items
    const itemCodes = new Set<string>();
    while (itemCodes.size < itemsWithoutCodes.length) {
      const code = await generateItemCode();
      itemCodes.add(code);
    }
    const codesArray = Array.from(itemCodes);

    console.log('🔄 Updating items with unique codes...');

    // Update each item with a unique code
    for (let i = 0; i < itemsWithoutCodes.length; i++) {
      const item = itemsWithoutCodes[i];
      const code = codesArray[i];

      await prisma.orderItem.update({
        where: { id: item.id },
        data: { itemCode: code },
      });

      console.log(
        `✅ Updated ${item.name} (Order: ${item.orderId}) with code: ${code}`
      );
    }

    console.log(
      `🎉 Successfully updated ${itemsWithoutCodes.length} items with unique codes!`
    );
  } catch (error) {
    console.error('❌ Error populating item codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateItemCodes();
