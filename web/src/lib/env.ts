import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
    .refine(
      (val) =>
        process.env.NODE_ENV !== 'production' || val.startsWith('https://'),
      'In production, NEXT_PUBLIC_SITE_URL must start with https://'
    ),
  NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default('MarinaObuv'),
});

const raw = {
  NODE_ENV: process.env.NODE_ENV as 'development' | 'test' | 'production' | undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'MarinaObuv',
};

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  // Fail fast in all environments
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
