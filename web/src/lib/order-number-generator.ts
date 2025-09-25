import { prisma } from './db-node';

/**
 * Generate a human-readable order number
 * Format: ORD-YYYYMMDD-XXXX
 * Example: ORD-20250120-0001
 *
 * Best practices:
 * - Short and memorable
 * - Includes date for easy reference
 * - Sequential numbering per day
 * - Prefix for easy identification
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Find the highest order number for today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const lastOrder = await prisma.order.findFirst({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
      orderNumber: {
        startsWith: `ORD-${dateStr}-`,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let sequence = 1;
  if (lastOrder?.orderNumber) {
    // Extract sequence number from last order
    const parts = lastOrder.orderNumber.split('-');
    const lastSequence = parseInt(parts[2] || '0', 10);
    sequence = lastSequence + 1;
  }

  const orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;

  // Double-check uniqueness (should be extremely rare)
  const exists = await prisma.order.findFirst({
    where: { orderNumber },
    select: { id: true },
  });

  if (exists) {
    // If somehow exists, add timestamp suffix
    const timestamp = now.getTime().toString().slice(-4);
    return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}-${timestamp}`;
  }

  return orderNumber;
}

/**
 * Alternative format: Short alphanumeric
 * Format: ORD-XXXXXX
 * Example: ORD-A1B2C3
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

  const orderNumber = `ORD-${shortCode}`;

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
    return `ORD-${shortCode}${randomSuffix}`;
  }

  return orderNumber;
}
