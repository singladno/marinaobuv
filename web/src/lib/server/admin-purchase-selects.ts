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

/** List/detail page: cap images per product to keep GET payload small (full select for item CRUD). */
export const prismaProductSelectForPurchaseDetailList = {
  id: true,
  slug: true,
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sort: 'asc' as const }],
    take: 10,
    select: {
      id: true,
      url: true,
      color: true,
      isPrimary: true,
      sort: true,
    },
  },
};

/**
 * First paint for purchase detail (`?lite=1`): minimal images so JSON stays small — most of the
 * previous ~600KB+ lite payload was image URL arrays, not descriptions.
 */
export const prismaProductSelectForPurchaseDetailListLite = {
  id: true,
  slug: true,
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sort: 'asc' as const }],
    take: 2,
    select: {
      id: true,
      url: true,
      color: true,
      isPrimary: true,
      sort: true,
    },
  },
};
