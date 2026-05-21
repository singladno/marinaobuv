import { Prisma } from '@prisma/client';

/**
 * Digit-only queries are article lookups. Slugs like `product-1776575789389-…`
 * embed timestamps that falsely match article substrings (e.g. "765757").
 */
export function isArticleNumberQuery(search: string): boolean {
  return /^\d+$/.test(search.trim());
}

export function buildProductSearchWhere(
  search: string
): Prisma.ProductWhereInput {
  const trimmed = search.trim();
  const searchLower = trimmed.toLowerCase();

  if (isArticleNumberQuery(trimmed)) {
    return {
      article: { contains: trimmed, mode: 'insensitive' },
    };
  }

  return {
    OR: [
      { name: { contains: searchLower, mode: 'insensitive' } },
      { article: { contains: searchLower, mode: 'insensitive' } },
      { description: { contains: searchLower, mode: 'insensitive' } },
    ],
  };
}

export function buildProductSearchSql(search: string): Prisma.Sql {
  const trimmed = search.trim();

  if (isArticleNumberQuery(trimmed)) {
    const pattern = `%${trimmed.toLowerCase()}%`;
    return Prisma.sql`LOWER(COALESCE(p.article, '')) LIKE ${pattern}`;
  }

  const pattern = `%${trimmed.toLowerCase()}%`;
  return Prisma.sql`(
    LOWER(p.name) LIKE ${pattern}
    OR LOWER(COALESCE(p.article, '')) LIKE ${pattern}
    OR LOWER(COALESCE(p.description, '')) LIKE ${pattern}
  )`;
}
