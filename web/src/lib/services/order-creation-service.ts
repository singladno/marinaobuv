import { generateItemCodes } from '@/lib/itemCodeGenerator';
import { generateOrderNumber } from '@/lib/order-number-generator';
import { prisma } from '@/lib/server/db';

interface CreateOrderItem {
  slug: string;
  qty: number;
}

function getBoxPriceFromPair(pricePair: any, sizes: any[]): number {
  const pairs = Array.isArray(sizes)
    ? sizes.reduce((sum, s) => sum + Number(s?.stock ?? 0), 0)
    : 0;
  return Number(pricePair) * (pairs > 0 ? pairs : 1);
}

export async function createOrder(
  userId: string,
  items: CreateOrderItem[],
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    comment?: string;
  }
) {
  // Get products with their details
  const products = await prisma.product.findMany({
    where: {
      slug: {
        in: items.map(item => item.slug),
      },
    },
    include: {
      sizes: true,
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
    const product = products.find(p => p.slug === item.slug);
    if (!product) continue;

    const boxPrice = getBoxPriceFromPair(product.pricePair, product.sizes);
    const itemTotal = boxPrice * item.qty;
    total += itemTotal;

    // Generate item codes
    const itemCodes = await generateItemCodes(item.qty);

    orderItems.push({
      slug: product.slug,
      name: product.name,
      priceBox: boxPrice,
      qty: item.qty,
      product: {
        connect: { id: product.id },
      },
      itemCodes,
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
    orderBy: {
      createdAt: 'desc',
    },
  });
}
