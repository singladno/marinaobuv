import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';
import { buildProductSearchSql } from '@/lib/server/catalog-search';

/** True when filter includes WhatsApp/Telegram chat ids (needs EXISTS, not a huge IN list). */
export function hasChatSourceFilter(sourceIds: string[]): boolean {
  return sourceIds.some(s => s.startsWith('WA:') || s.startsWith('TG:'));
}

function buildOrderSql(sortBy: string): Prisma.Sql {
  switch (sortBy) {
    case 'price_asc':
      return Prisma.sql`p."pricePair" ASC`;
    case 'price_desc':
      return Prisma.sql`p."pricePair" DESC`;
    case 'updated':
      return Prisma.sql`p."activeUpdatedAt" DESC`;
    case 'oldest':
      return Prisma.sql`p."createdAt" ASC`;
    case 'name_asc':
      return Prisma.sql`p.name ASC`;
    case 'name_desc':
      return Prisma.sql`p.name DESC`;
    case 'newest':
    default:
      return Prisma.sql`p."createdAt" DESC`;
  }
}

export type ChatSourceCatalogQuery = {
  isAdmin: boolean;
  sourceIds: string[];
  search: string;
  categoryIds: string[] | null;
  minPrice?: number;
  maxPrice?: number;
  normalizedColors: string[];
  sortBy: string;
  skip: number;
  take: number;
};

/**
 * Paginated product ids when WA/TG chat filters are active.
 * Uses EXISTS in SQL instead of prefetching tens of thousands of ids into an IN clause.
 */
export async function queryProductIdsWithChatSourceFilter(
  options: ChatSourceCatalogQuery
): Promise<{ ids: string[]; total: number }> {
  const andParts: Prisma.Sql[] = [
    Prisma.sql`(
      p."batchProcessingStatus" = 'completed'
      OR p.source = 'MANUAL'
      OR p.source = 'AG'
    )`,
  ];

  if (!options.isAdmin) {
    andParts.push(Prisma.sql`p."isActive" = true`);
  }

  const sourceOr = buildAdminSourceSqlOr(options.sourceIds);
  if (sourceOr) {
    andParts.push(Prisma.sql`(${sourceOr})`);
  } else {
    andParts.push(Prisma.sql`FALSE`);
  }

  if (options.search) {
    andParts.push(Prisma.sql`(${buildProductSearchSql(options.search)})`);
  }

  if (options.categoryIds && options.categoryIds.length > 0) {
    andParts.push(
      Prisma.sql`p."categoryId" IN (${Prisma.join(options.categoryIds)})`
    );
  }

  if (options.minPrice !== undefined) {
    andParts.push(Prisma.sql`p."pricePair" >= ${options.minPrice}`);
  }
  if (options.maxPrice !== undefined) {
    andParts.push(Prisma.sql`p."pricePair" <= ${options.maxPrice}`);
  }

  if (options.normalizedColors.length > 0) {
    const colorLiterals = options.normalizedColors.map(
      c => Prisma.sql`LOWER(${c})`
    );
    andParts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ProductImage" img
      WHERE img."productId" = p.id
        AND img."isPrimary" = true
        AND LOWER(COALESCE(img.color, '')) IN (${Prisma.join(colorLiterals)})
    )`);
  }

  const whereSql = Prisma.join(andParts, ' AND ');
  const orderSql = buildOrderSql(options.sortBy);

  const [rows, countRow] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id FROM "Product" p
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${options.take} OFFSET ${options.skip}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM "Product" p
      WHERE ${whereSql}
    `,
  ]);

  return {
    ids: rows.map(r => r.id),
    total: Number(countRow[0]?.count ?? 0),
  };
}

function waChatExistsSql(chatId: string): Prisma.Sql {
  return Prisma.sql`
    (
      p.source = 'WA'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(COALESCE(p."sourceMessageIds", '[]'::jsonb)) = 'array'
            THEN COALESCE(p."sourceMessageIds", '[]'::jsonb)
            ELSE '[]'::jsonb
          END
        ) AS msg_id
        INNER JOIN "WhatsAppMessage" w ON w.id = msg_id
        WHERE w."chatId" = ${chatId}
      )
    )
  `;
}

function tgChatExistsSql(chatId: string): Prisma.Sql {
  return Prisma.sql`
    (
      p.source = 'TG'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(COALESCE(p."sourceMessageIds", '[]'::jsonb)) = 'array'
            THEN COALESCE(p."sourceMessageIds", '[]'::jsonb)
            ELSE '[]'::jsonb
          END
        ) AS msg_id
        INNER JOIN "TelegramMessage" t ON t.id = msg_id
        WHERE t."chatId" = ${chatId}
      )
    )
  `;
}

/** SQL OR branches for admin source filter (no prefetch of product ids). */
export function buildAdminSourceSqlOr(sourceIds: string[]): Prisma.Sql | null {
  const parts: Prisma.Sql[] = [];
  if (sourceIds.includes('AG')) parts.push(Prisma.sql`p.source = 'AG'`);
  if (sourceIds.includes('MANUAL')) parts.push(Prisma.sql`p.source = 'MANUAL'`);
  for (const sid of sourceIds.filter(s => s.startsWith('WA:'))) {
    parts.push(waChatExistsSql(sid.slice(3)));
  }
  for (const sid of sourceIds.filter(s => s.startsWith('TG:'))) {
    parts.push(tgChatExistsSql(sid.slice(3)));
  }
  if (parts.length === 0) return null;
  return Prisma.join(parts, ' OR ');
}

/** Prisma where for AG/MANUAL-only source filters (no chat EXISTS). */
export function buildSimpleAdminSourceWhere(
  sourceIds: string[]
): Prisma.ProductWhereInput | null {
  const or: Prisma.ProductWhereInput[] = [];
  if (sourceIds.includes('AG')) or.push({ source: 'AG' });
  if (sourceIds.includes('MANUAL')) or.push({ source: 'MANUAL' });
  if (or.length === 0) return null;
  return { OR: or };
}
