import { prisma } from './db-node';

/**
 * Generate a sequential order number
 * Format: XXXXX (numbers only)
 * Example: 10000, 10001, 10002
 *
 * Best practices:
 * - Simple sequential numbering starting from 10000
 * - Easy to remember and reference
 * - Database sequence ensures uniqueness
 * - No date dependency for better performance
 */
export async function generateOrderNumber(): Promise<string> {
  try {
    // Use the database function to get the next order number
    const result = await prisma.$queryRaw<[{ get_next_order_number: string }]>`
      SELECT get_next_order_number() as get_next_order_number
    `;

    const orderNumber = result[0]?.get_next_order_number;

    if (!orderNumber) {
      throw new Error('Failed to generate order number');
    }

    // Double-check uniqueness (should be extremely rare with sequence)
    const exists = await prisma.order.findFirst({
      where: { orderNumber },
      select: { id: true },
    });

    if (exists) {
      // If somehow exists, try again (this should be extremely rare)
      return await generateOrderNumber();
    }

    return orderNumber;
  } catch (error) {
    console.error('Error generating order number:', error);

    // Fallback: find the highest existing order number and increment
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          // Match numeric order numbers using Prisma's string filters
          not: {
            contains: '-',
          },
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
      select: {
        orderNumber: true,
      },
    });

    let nextNumber = 10000;
    if (lastOrder?.orderNumber) {
      // Parse the numeric order number
      const parsedNumber = parseInt(lastOrder.orderNumber, 10);
      if (!isNaN(parsedNumber)) {
        nextNumber = parsedNumber + 1;
      }
    }

    const orderNumber = nextNumber.toString();

    // Final uniqueness check
    const exists = await prisma.order.findFirst({
      where: { orderNumber },
      select: { id: true },
    });

    if (exists) {
      // If still exists, add timestamp suffix as last resort
      const timestamp = Date.now().toString().slice(-4);
      return `${nextNumber}-${timestamp}`;
    }

    return orderNumber;
  }
}

/**
 * Alternative format: Short alphanumeric
 * Format: XXXXXX (alphanumeric only)
 * Example: A1B2C3
 *
 * Uses base36 encoding for shorter, more memorable codes
 */
export async function generateShortOrderNumber(): Promise<string> {
  const now = new Date();
  const timestamp = now.getTime();

  // Convert timestamp to base36 for shorter representation
  const base36 = timestamp.toString(36).toUpperCase();

  // Take last 6 characters and ensure it's not too short
  let shortCode = base36.slice(-6);
  if (shortCode.length < 6) {
    shortCode = shortCode.padStart(6, '0');
  }

  const orderNumber = shortCode;

  // Check uniqueness
  const exists = await prisma.order.findFirst({
    where: { orderNumber },
    select: { id: true },
  });

  if (exists) {
    // Add random suffix if collision
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 4)
      .toUpperCase();
    return `${shortCode}${randomSuffix}`;
  }

  return orderNumber;
}
