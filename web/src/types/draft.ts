import { z } from 'zod';

export const ProductDraftSchema = z.object({
  season: z
    .string()
    .nullable()
    .optional()
    .transform(val => {
      if (val === null || val === undefined) return undefined;

      // Handle multiple seasons separated by | or ,
      const seasons = val.split(/[|,]/).map(s => s.trim().toLowerCase());
      const validSeasons = ['spring', 'summer', 'autumn', 'winter'];

      // If multiple seasons, return the first valid one
      for (const season of seasons) {
        if (validSeasons.includes(season)) {
          return season;
        }
      }

      // If no valid season found, return null
      return null;
    }),
  typeSlug: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  pricePair: z.coerce
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  // packPairs and priceBox are derived from sizes on FE
  material: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  gender: z
    .enum(['female', 'male'])
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  sizes: z
    .array(
      z.object({
        size: z.string(),
        count: z.coerce
          .number()
          .nullable()
          .transform(val => (val === null ? 0 : val)),
      })
    )
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  providerDiscount: z.coerce
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
});

export type ProductDraft = z.infer<typeof ProductDraftSchema>;

// Extended type for draft product data with all properties
export interface DraftProductData {
  name?: string | null;
  pricePair?: number | null;
  currency?: string | null;
  material?: string | null;
  gender?: string | null;
  season?: string | null;
  sizes?: Array<{
    size: string;
    count: number;
  }> | null;
  packPairs?: number | null;
  priceBox?: number | null;
  notes?: string | null;
  providerDiscount?: number | null;
  typeSlug?: string | null;
}
