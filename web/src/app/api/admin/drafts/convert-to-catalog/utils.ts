import { prisma } from '@/lib/server/db';
import { slugify } from '@/utils/slugify';

export async function generateUniqueSlug(
  name: string,
  id: string
): Promise<string> {
  const baseSlug = slugify(`${name}-${id.slice(0, 6)}`);
  let slug = baseSlug;

  for (let i = 1; i < 50; i++) {
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  return slug;
}

interface DraftImage {
  isActive?: boolean;
  isPrimary?: boolean;
  sort?: number;
  url: string;
  key: string;
  alt?: string;
  color?: string;
  width?: number;
  height?: number;
}

interface DraftSize {
  size?: string;
  name?: string;
  stock?: number;
  count?: number;
  perBox?: number;
}

interface DraftProduct {
  id: string;
  name: string;
  pricePair?: number;
  currency?: string;
  material?: string;
  gender?: string;
  season?: string;
  description?: string;
  categoryId?: string;
  images?: DraftImage[];
  sizes?: DraftSize[];
}

export function processDraftImages(images: DraftImage[]) {
  return (images || [])
    .filter(img => img.isActive !== false)
    .sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        (a.sort ?? 0) - (b.sort ?? 0)
    );
}

export function processDraftSizes(sizes: DraftSize[]) {
  if (!sizes || !Array.isArray(sizes)) return [];

  return sizes.map((size: DraftSize) => ({
    size: size.size || size.name || 'Unknown',
    perBox: size.perBox || null,
    stock: size.count || size.stock || null,
    sku: null,
  }));
}

interface ProcessedSize {
  size: string;
  perBox: number | null;
  stock: number | null;
  sku: string | null;
}

export function createProductData(
  draft: DraftProduct,
  slug: string,
  processedImages: DraftImage[],
  processedSizes: ProcessedSize[]
) {
  const draftPricePair =
    draft.pricePair != null ? Number(draft.pricePair) : null;
  const pricePairFinal: number | null = draftPricePair;

  return {
    slug,
    name: draft.name || 'Без названия',
    pricePair: pricePairFinal ?? 0,
    currency: draft.currency ?? 'RUB',
    material: draft.material ?? null,
    gender: draft.gender ?? null,
    season: draft.season ?? null,
    description: draft.description ?? null,
    images: {
      create: processedImages.map(img => ({
        url: img.url,
        key: img.key,
        alt: (img as { alt?: string }).alt ?? null,
        sort: img.sort ?? 0,
        isPrimary: Boolean(img.isPrimary),
        color: img.color ?? null,
        width: (img as { width?: number }).width ?? null,
        height: (img as { height?: number }).height ?? null,
      })),
    },
    sizes: {
      create: processedSizes,
    },
    categoryId: draft.categoryId,
    isActive: true,
  };
}
