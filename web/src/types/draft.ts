import { z } from 'zod';

export const ProductDraftSchema = z.object({
  name: z.string().min(1).optional(),
  article: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  season: z
    .enum(['spring', 'summer', 'autumn', 'winter'])
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
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
  packPairs: z.coerce
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  priceBox: z.coerce
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  material: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  gender: z
    .enum(['female', 'male', 'unisex'])
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
});

export type ProductDraft = z.infer<typeof ProductDraftSchema>;
