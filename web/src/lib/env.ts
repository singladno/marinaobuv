import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
      .refine(
        val =>
          process.env.NODE_ENV !== 'production' || val.startsWith('https://'),
        'In production, NEXT_PUBLIC_SITE_URL must start with https://'
      ),
    NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default('MarinaObuv'),

    // Whapi.cloud API
    WHAPI_BASE_URL: z.string().url('WHAPI_BASE_URL must be a valid URL'),
    WHAPI_TOKEN: z.string().min(1, 'WHAPI_TOKEN is required'),
    WHAPI_WEBHOOK_SECRET: z
      .string()
      .min(32, 'WHAPI_WEBHOOK_SECRET must be at least 32 characters'),
    WHAPI_VERIFY_TOKEN: z.string().optional(),

    // S3 Configuration
    S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL'),
    S3_REGION: z.string().min(1, 'S3_REGION is required'),
    S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
    S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY is required'),
    S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY is required'),
    CDN_BASE_URL: z.string().url('CDN_BASE_URL must be a valid URL'),

    // Yandex Cloud
    YC_FOLDER_ID: z.string().min(1, 'YC_FOLDER_ID is required'),
    YC_IAM_TOKEN: z.string().optional(),
    YC_API_KEY: z.string().optional(),

    // Target Group Chat ID for Processing
    TARGET_GROUP_ID: z.string().optional(),

    // Message Fetch Configuration
    MESSAGE_FETCH_HOURS: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return 24; // Default to 24 hours
        const parsed = parseFloat(val);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error(
            'MESSAGE_FETCH_HOURS must be a positive number (supports decimals like 3.5)'
          );
        }
        return parsed;
      }),
  })
  .refine(
    data => data.YC_IAM_TOKEN || data.YC_API_KEY,
    'Either YC_IAM_TOKEN or YC_API_KEY must be provided'
  );

const raw = {
  NODE_ENV: process.env.NODE_ENV as
    | 'development'
    | 'test'
    | 'production'
    | undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'MarinaObuv',

  // Whapi.cloud API
  WHAPI_BASE_URL: process.env.WHAPI_BASE_URL,
  WHAPI_TOKEN: process.env.WHAPI_TOKEN,
  WHAPI_WEBHOOK_SECRET: process.env.WHAPI_WEBHOOK_SECRET,
  WHAPI_VERIFY_TOKEN: process.env.WHAPI_VERIFY_TOKEN,

  // S3 Configuration
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  CDN_BASE_URL: process.env.CDN_BASE_URL,

  // Yandex Cloud
  YC_FOLDER_ID: process.env.YC_FOLDER_ID,
  YC_IAM_TOKEN: process.env.YC_IAM_TOKEN,
  YC_API_KEY: process.env.YC_API_KEY,

  // Target Group Chat ID for Processing
  TARGET_GROUP_ID: process.env.TARGET_GROUP_ID,

  // Message Fetch Configuration
  MESSAGE_FETCH_HOURS: process.env.MESSAGE_FETCH_HOURS,
};

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // Fail fast in all environments
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
