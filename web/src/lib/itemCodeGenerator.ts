import { prisma } from './db-node';

/**
 * Generates a unique item code for order items
 * Format: Sequential number (1, 2, 3, etc.)
 * Example: 1, 2, 3, 4, 5
 */
export async function generateItemCode(): Promise<string> {
  try {
    // Use the database function to get the next item ID
    const result = await prisma.$queryRaw<[{ get_next_order_item_id: string }]>`
      SELECT get_next_order_item_id() as get_next_order_item_id
    `;

    const itemId = result[0]?.get_next_order_item_id;

    if (!itemId) {
      throw new Error('Failed to generate item ID');
    }

    // Double-check uniqueness (should be extremely rare with sequence)
    const exists = await prisma.orderItem.findFirst({
      where: { itemCode: itemId },
      select: { id: true },
    });

    if (exists) {
      // If somehow exists, try again (this should be extremely rare)
      return await generateItemCode();
    }

    return itemId;
  } catch (error) {
    console.error('Error generating item ID:', error);

    // Fallback: find the highest existing item code and increment
    const lastItem = await prisma.orderItem.findFirst({
      where: {
        itemCode: {
          // Match numeric item codes
          not: {
            contains: '-',
          },
        },
      },
      orderBy: {
        itemCode: 'desc',
      },
      select: {
        itemCode: true,
      },
    });

    let nextNumber = 1;
    if (lastItem?.itemCode) {
      // Parse the numeric item code
      const parsedNumber = parseInt(lastItem.itemCode, 10);
      if (!isNaN(parsedNumber)) {
        nextNumber = parsedNumber + 1;
      }
    }

    const itemId = nextNumber.toString();

    // Final uniqueness check
    const exists = await prisma.orderItem.findFirst({
      where: { itemCode: itemId },
      select: { id: true },
    });

    if (exists) {
      // If still exists, add timestamp suffix as last resort
      const timestamp = Date.now().toString().slice(-6);
      return `${nextNumber}-${timestamp}`;
    }

    return itemId;
  }
}

/**
 * Generates multiple unique item codes
 */
export async function generateItemCodes(count: number): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = await generateItemCode();
    codes.push(code);
  }

  return codes;
}
