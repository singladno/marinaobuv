import { generateItemCode } from '@/lib/itemCodeGenerator';
import { generateOrderNumber } from '@/lib/order-number-generator';
import { scriptPrisma as prisma } from '@/lib/script-db';
import { emailService } from '@/lib/server/email';

interface CreateOrderItem {
  slug?: string;
  productId?: string;
  qty: number;
  color?: string | null;
}

function getBoxPriceFromPair(pricePair: any, sizes: any): number {
  const price = Number(pricePair) || 0;
  if (!sizes) {
    return price; // Default to 1 pair if no sizes
  }

  // Handle JSON string if needed
  let sizesArray: any[] = [];
  if (typeof sizes === 'string') {
    try {
      sizesArray = JSON.parse(sizes);
    } catch {
      return price; // If parsing fails, default to 1 pair
    }
  } else if (Array.isArray(sizes)) {
    sizesArray = sizes;
  } else {
    return price; // If not array or string, default to 1 pair
  }

  // Sum up the count from all sizes to get total pairs
  // This correctly handles cases where one size has multiple pairs (count > 1)
  const totalPairs = sizesArray.reduce((sum: number, size: any) => {
    if (!size || typeof size !== 'object') {
      return sum;
    }

    // Try different possible field names for count
    const count =
      (typeof size.count === 'number' ? size.count : 0) ||
      (typeof size.quantity === 'number' ? size.quantity : 0) ||
      (typeof size.stock === 'number' ? size.stock : 0) ||
      (typeof size.qty === 'number' ? size.qty : 0) ||
      0;

    return sum + Number(count);
  }, 0);

  // If no pairs found, default to 1
  const pairs = totalPairs > 0 ? totalPairs : 1;
  return price * pairs;
}

export async function createOrder(
  userId: string,
  items: CreateOrderItem[],
  customerInfo: {
    name?: string;
    phone: string;
    address?: string;
    comment?: string;
  },
  transportCompanyId?: string,
  transportOptions?: Array<{ id: string; name: string }>
) {
  // Get products with their details
  // Support items defined by slug or by productId
  const productIds = items
    .map(i => i.productId)
    .filter((v): v is string => Boolean(v));
  const productSlugs = items
    .map(i => i.slug)
    .filter((v): v is string => Boolean(v));

  const products = await prisma.product.findMany({
    where: {
      OR: [
        productSlugs.length > 0
          ? {
              slug: {
                in: productSlugs,
              },
            }
          : undefined,
        productIds.length > 0
          ? {
              id: {
                in: productIds,
              },
            }
          : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      images: {
        select: {
          id: true,
          url: true,
          alt: true,
        },
      },
    },
  });

  // Allow duplicate items for the same product (e.g., different colors)
  // Validate that every referenced product (by slug or id) exists at least once
  const missing = items.filter(
    i => !products.some(p => p.slug === i.slug || p.id === i.productId)
  );
  if (missing.length > 0) {
    throw new Error('Some products not found');
  }

  // Calculate total and prepare order items
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = products.find(
      p => p.slug === item.slug || p.id === item.productId
    );
    if (!product) continue;

    const boxPrice = getBoxPriceFromPair(product.pricePair, product.sizes);
    const itemTotal = boxPrice * item.qty;
    total += itemTotal;

    // Generate a single item code for this order line
    const itemCode = await generateItemCode();

    orderItems.push({
      slug: product.slug,
      name: product.name,
      priceBox: boxPrice,
      qty: item.qty,
      color: item.color ?? null,
      product: {
        connect: { id: product.id },
      },
      itemCode,
    });
  }

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Get user's label to inherit it
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { label: true },
  });

  // Create the order
  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber,
      total,
      fullName: customerInfo.name,
      phone: customerInfo.phone,
      address: customerInfo.address,
      comment: customerInfo.comment,
      transportId: transportCompanyId,
      label: user?.label || null, // Inherit label from user
      items: {
        create: orderItems,
      },
      transportOptions: transportOptions
        ? {
            create: transportOptions.map(option => ({
              transportId: option.id,
              transportName: option.name,
              isSelected: true,
            })),
          }
        : undefined,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                select: {
                  id: true,
                  url: true,
                  alt: true,
                },
              },
            },
          },
        },
      },
      transportOptions: true,
    },
  });

  // Send order confirmation email if user has email
  try {
    const userWithEmail = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (userWithEmail?.email) {
      await emailService.sendOrderConfirmationEmail(
        userWithEmail.email,
        orderNumber,
        {
          order,
          customerInfo,
        }
      );
    }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't fail order creation if email fails
  }

  return order;
}

export async function getOrders(userId: string) {
  return prisma.order.findMany({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              article: true,
              pricePair: true,
              images: {
                select: {
                  id: true,
                  url: true,
                  alt: true,
                  color: true,
                },
              },
            },
          },
          replacements: {
            where: {
              clientUserId: userId,
            },
            select: {
              id: true,
              status: true,
              replacementImageUrl: true,
              adminComment: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
      transportOptions: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
