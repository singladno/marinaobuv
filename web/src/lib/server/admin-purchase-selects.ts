/**
 * Narrow product payload for admin purchase APIs — avoids multi‑MB JSON from
 * full Product rows + unbounded image fields.
 */
export const prismaProductSelectForPurchaseItem = {
  id: true,
  slug: true,
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sort: 'asc' as const }],
    select: {
      id: true,
      url: true,
      color: true,
      isPrimary: true,
      sort: true,
    },
  },
};
