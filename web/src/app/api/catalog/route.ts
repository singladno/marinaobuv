import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { normalizeToStandardColor } from '@/lib/constants/colors';

/**
 * Recursively get all descendant category IDs from a parent category
 */
async function getAllSubcategoryIds(categoryId: string): Promise<string[]> {
  const children = await prisma.category.findMany({
    where: { parentId: categoryId, isActive: true },
    select: { id: true },
  });

  const childIds = children.map(child => child.id);
  const allDescendantIds: string[] = [...childIds];

  // Recursively get IDs from all nested subcategories
  for (const childId of childIds) {
    const nestedIds = await getAllSubcategoryIds(childId);
    allDescendantIds.push(...nestedIds);
  }

  return allDescendantIds;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined;
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined;
    const colors = searchParams.get('colors')
      ? searchParams.get('colors')!.split(',')
      : [];
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const inStock = searchParams.get('inStock') === 'true';
    const sourceIds =
      searchParams.get('sourceIds')?.split(',').filter(Boolean) ?? [];

    // Get session for search history using NextAuth
    const auth = await requireAuth(request);

    // Build where clause
    // Include products that are either:
    // 1. Completed batch processing (parsed from WhatsApp)
    // 2. Manually created (source: 'MANUAL')
    // 3. Parsed from aggregator (source: 'AG')
    const where: any = {
      AND: [
        {
          OR: [
            { batchProcessingStatus: 'completed' },
            { source: 'MANUAL' },
            { source: 'AG' },
          ],
        },
      ],
    };

    // Only show active products for non-admin users
    // Admin users can see both active and inactive products
    if (auth.user?.role !== 'ADMIN') {
      where.isActive = true;
    }

    // Admin-only: filter by source (one or multiple)
    if (
      auth.user?.role === 'ADMIN' &&
      sourceIds.length > 0
    ) {
      const allowedIds: string[] = [];
      if (sourceIds.includes('AG')) {
        const ag = await prisma.product.findMany({
          where: { source: 'AG' },
          select: { id: true },
        });
        allowedIds.push(...ag.map(p => p.id));
      }
      if (sourceIds.includes('MANUAL')) {
        const manual = await prisma.product.findMany({
          where: { source: 'MANUAL' },
          select: { id: true },
        });
        allowedIds.push(...manual.map(p => p.id));
      }
      // Only expand sourceMessageIds when it's a JSON array; non-array values would make jsonb_array_elements_text throw.
      // Use LATERAL + explicit alias so JOIN is unambiguous.
      const waSourceIds = sourceIds.filter(s => s.startsWith('WA:'));
      for (const sid of waSourceIds) {
        const chatId = sid.slice(3);
        const rows = await prisma.$queryRaw<{ id: string }[]>`
          SELECT DISTINCT p.id FROM "Product" p
          CROSS JOIN LATERAL jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(COALESCE(p."sourceMessageIds", '[]'::jsonb)) = 'array'
                 THEN COALESCE(p."sourceMessageIds", '[]'::jsonb)
                 ELSE '[]'::jsonb
            END
          ) AS msg_id
          INNER JOIN "WhatsAppMessage" w ON w.id = msg_id
          WHERE p.source = 'WA' AND w."chatId" = ${chatId}
        `;
        allowedIds.push(...rows.map(r => r.id));
      }
      const tgSourceIds = sourceIds.filter(s => s.startsWith('TG:'));
      for (const sid of tgSourceIds) {
        const chatId = sid.slice(3);
        const rows = await prisma.$queryRaw<{ id: string }[]>`
          SELECT DISTINCT p.id FROM "Product" p
          CROSS JOIN LATERAL jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(COALESCE(p."sourceMessageIds", '[]'::jsonb)) = 'array'
                 THEN COALESCE(p."sourceMessageIds", '[]'::jsonb)
                 ELSE '[]'::jsonb
            END
          ) AS msg_id
          INNER JOIN "TelegramMessage" t ON t.id = msg_id
          WHERE p.source = 'TG' AND t."chatId" = ${chatId}
        `;
        allowedIds.push(...rows.map(r => r.id));
      }
      const uniqueIds = [...new Set(allowedIds)];
      if (uniqueIds.length > 0) {
        where.id = { in: uniqueIds };
      } else {
        where.id = { in: ['__none__'] };
      }
    }

    // Search functionality - case insensitive for Cyrillic and Latin characters
    if (search) {
      const searchLower = search.toLowerCase();
      where.AND.push({
        OR: [
          { name: { contains: searchLower, mode: 'insensitive' } },
          { article: { contains: searchLower, mode: 'insensitive' } },
          { slug: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      });
    }

    // Category filter - include products from subcategories (recursively)
    if (categoryId) {
      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (category) {
        // Get all descendant category IDs recursively (including nested subcategories)
        const allSubcategoryIds = await getAllSubcategoryIds(categoryId);

        // Include products from the category itself and all its subcategories
        where.categoryId = {
          in: [categoryId, ...allSubcategoryIds],
        };
      } else {
        // Fallback to direct category if not found
        where.categoryId = categoryId;
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePair = {};
      if (minPrice !== undefined) {
        where.pricePair.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.pricePair.lte = maxPrice;
      }
    }

    // Color filter - find products where the primary image color matches the selected color
    if (colors.length > 0) {
      // Normalize colors to standard colors and filter out invalid ones
      const normalizedColors = colors
        .map(color => normalizeToStandardColor(color))
        .filter((color): color is NonNullable<typeof color> => color !== null);

      if (normalizedColors.length > 0) {
        where.images = {
          some: {
            isPrimary: true,
            color: {
              in: normalizedColors,
              mode: 'insensitive',
            },
          },
        };
      }
    }

    // Stock filter (if needed - you might want to add stock tracking)
    if (inStock) {
      // For now, we'll assume all products are in stock
      // You can add stock tracking later
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }; // Default to newest first

    switch (sortBy) {
      case 'price_asc':
        orderBy = { pricePair: 'asc' };
        break;
      case 'price_desc':
        orderBy = { pricePair: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'updated':
        orderBy = { activeUpdatedAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            where: {
              isActive: true,
            },
            orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
            select: {
              url: true,
              color: true,
              isPrimary: true,
            },
          },
          videos: {
            where: {
              isActive: true,
            },
            orderBy: { sort: 'asc' },
            select: {
              id: true,
              url: true,
              alt: true,
              sort: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Transform the data to include primaryImageUrl and colorOptions
    const transformedProducts = products.map((product: any) => {
      const primaryImageUrl = product.images?.[0]?.url || null;
      const seen = new Set<string>();
      const colorOptions = (product.images || [])
        .filter((img: any) => !!img.color)
        .filter((img: any) => {
          const key = (img.color || '').toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((img: any) => ({ color: img.color as string, imageUrl: img.url }));

      return {
        ...product,
        primaryImageUrl,
        colorOptions,
        isActive: product.isActive ?? true,
        sourceScreenshotUrl: product.sourceScreenshotUrl || null,
      };
    });

    // Save search history if user is logged in and search query is provided

    if (search && search.trim().length > 0) {
      try {
        const normalized = search.trim();
        const userId = auth.user?.id || null;

        if (userId) {
          // For logged-in users: upsert by case-insensitive query to avoid duplicates
          const existing = await prisma.searchHistory.findFirst({
            where: {
              userId,
              query: { equals: normalized, mode: 'insensitive' },
            },
            select: { id: true },
          });

          if (existing) {
            await prisma.searchHistory.update({
              where: { id: existing.id },
              data: { query: normalized, createdAt: new Date() },
            });
          } else {
            await prisma.searchHistory.create({
              data: { query: normalized, userId },
            });
          }
        } else {
          // Anonymous searches: still persist but dedupe by latest same query
          const existing = await prisma.searchHistory.findFirst({
            where: {
              userId: null,
              query: { equals: normalized, mode: 'insensitive' },
            },
            select: { id: true },
          });

          if (existing) {
            await prisma.searchHistory.update({
              where: { id: existing.id },
              data: { query: normalized, createdAt: new Date() },
            });
          } else {
            await prisma.searchHistory.create({
              data: { query: normalized, userId: null },
            });
          }
        }
      } catch (error) {
        // Don't fail the request if search history saving fails
      }
    }

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        search,
        categoryId,
        sortBy,
        minPrice,
        maxPrice,
        colors,
        inStock,
        ...(auth.user?.role === 'ADMIN' && { sourceIds }),
      },
    });
  } catch (error) {
    console.error('[catalog] GET error:', error);
    const message = error instanceof Error ? error.message : 'Ошибка при получении каталога';
    return NextResponse.json(
      { error: 'Ошибка при получении каталога', details: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
