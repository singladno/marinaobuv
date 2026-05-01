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

/** Non-lite purchase GET: same full image list as lite so per-line color filtering works. */
export const prismaProductSelectForPurchaseDetailList = {
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

/**
 * First paint for purchase detail (`?lite=1`). Descriptions are loaded separately; image URLs are
 * still needed per purchase line so `getPurchaseItemGalleryImages` can filter by `PurchaseItem.color`.
 * A tiny `take` (e.g. 2) caused every color variant of the same product to show the same wrong
 * photos when those two rows did not include the item’s color.
 */
export const prismaProductSelectForPurchaseDetailListLite = {
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
