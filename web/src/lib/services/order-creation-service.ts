import { generateItemCode } from '@/lib/itemCodeGenerator';
import { generateOrderNumber } from '@/lib/order-number-generator';
import { prisma } from '@/lib/server/db';

interface CreateOrderItem {
  slug?: string;
  productId?: string;
  qty: number;
}

function getBoxPriceFromPair(pricePair: any, sizes: any): number {
  const pairs = Array.isArray(sizes) ? sizes.length : 0;
  return Number(pricePair) * (pairs > 0 ? pairs : 1);
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
  transportCompanyId?: string
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

  if (products.length !== items.length) {
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
      product: {
        connect: { id: product.id },
      },
      itemCode,
    });
  }

  // Generate order number
  const orderNumber = await generateOrderNumber();

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
      items: {
        create: orderItems,
      },
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
    },
  });

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
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
