import { z } from 'zod';

// Check if we're in a build context (GitHub Actions or build process)
const isBuildContext =
  process.env.NODE_ENV === 'production' &&
  (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    NEXT_PUBLIC_SITE_URL: isBuildContext
      ? z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL').optional()
      : z
          .string()
          .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
          .refine(
            val =>
              process.env.NODE_ENV !== 'production' ||
              val.startsWith('https://'),
            'In production, NEXT_PUBLIC_SITE_URL must start with https://'
          ),
    NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default('MarinaObuv'),

    // Whapi.cloud API - removed (no longer used)

    // Green API
    GREEN_API_INSTANCE_ID: z.string().optional(),
    GREEN_API_TOKEN: z.string().optional(),
    GREEN_API_BASE_URL: z.string().url().optional(),
    GREEN_API_DASHBOARD_URL: z.string().url().optional(),
    // Admin phone that gets ADMIN role on login
    ADMIN_PHONE: z.string().optional(),
    // Admin email that gets ADMIN role
    ADMIN_EMAIL: z.string().email().optional(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // S3 Configuration - make optional during build
    S3_ENDPOINT: isBuildContext
      ? z.string().url('S3_ENDPOINT must be a valid URL').optional()
      : z.string().url('S3_ENDPOINT must be a valid URL'),
    S3_REGION: isBuildContext
      ? z.string().min(1, 'S3_REGION is required').optional()
      : z.string().min(1, 'S3_REGION is required'),
    S3_BUCKET: isBuildContext
      ? z.string().min(1, 'S3_BUCKET is required').optional()
      : z.string().min(1, 'S3_BUCKET is required'),
    S3_ACCESS_KEY: isBuildContext
      ? z.string().min(1, 'S3_ACCESS_KEY is required').optional()
      : z.string().min(1, 'S3_ACCESS_KEY is required'),
    S3_SECRET_KEY: isBuildContext
      ? z.string().min(1, 'S3_SECRET_KEY is required').optional()
      : z.string().min(1, 'S3_SECRET_KEY is required'),
    CDN_BASE_URL: isBuildContext
      ? z.string().url('CDN_BASE_URL must be a valid URL').optional()
      : z.string().url('CDN_BASE_URL must be a valid URL'),

    // Yandex Cloud - make optional during build
    YC_FOLDER_ID: isBuildContext
      ? z.string().min(1, 'YC_FOLDER_ID is required').optional()
      : z.string().min(1, 'YC_FOLDER_ID is required'),
    YC_IAM_TOKEN: z.string().optional(),
    YC_API_KEY: z.string().optional(),

    // OpenAI Vision
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_REQUEST_DELAY_MS: z.string().optional(),
    OPENAI_VISION_MODEL: z.string().optional(),
    OPENAI_BASE_URL: z.string().url().optional(),
    OPENAI_PROXY: z.string().optional(),

    // Groq API
    GROQ_API_KEY: z.string().optional(),

    // Concurrency tuning (optional)
    MEDIA_REFRESH_CONCURRENCY: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return 5;
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 20) return 5;
        return parsed;
      }),
    IMAGE_DOWNLOAD_CONCURRENCY: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return 4;
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 20) return 4;
        return parsed;
      }),

    // Grouping batch size (max messages per grouping request)
    GROUPING_MAX_MESSAGES_PER_CALL: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return 100;
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 10) return 100;
        return parsed;
      }),

    // Target Group Chat ID for Processing
    TARGET_GROUP_ID: z.string().optional(),

    // Message Fetch Configuration - REMOVED: Messages now saved via webhooks

    // Processing Configuration
    PROCESSING_BATCH_SIZE: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return 300; // Default to 300 messages
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error('PROCESSING_BATCH_SIZE must be a positive integer');
        }
        return parsed;
      }),

    // Message Processing Time Range (in hours)
    MESSAGE_PROCESSING_HOURS: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return 24; // Default to 24 hours
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error(
            'MESSAGE_PROCESSING_HOURS must be a positive integer'
          );
        }
        return parsed;
      }),

    // SMS Configuration (SMS.ru)
    SMS_API_KEY: z.string().optional(),
    SMS_USE_CONSOLE: z.string().optional(),
  })
  .refine(
    data => isBuildContext || data.YC_IAM_TOKEN || data.YC_API_KEY,
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

  // Whapi.cloud API - removed (no longer used)

  // Green API
  GREEN_API_INSTANCE_ID: process.env.GREEN_API_INSTANCE_ID,
  GREEN_API_TOKEN: process.env.GREEN_API_TOKEN,
  GREEN_API_BASE_URL: process.env.GREEN_API_BASE_URL,
  GREEN_API_DASHBOARD_URL: process.env.GREEN_API_DASHBOARD_URL,
  ADMIN_PHONE: process.env.ADMIN_PHONE,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

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

  // OpenAI Vision
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_PROXY: process.env.OPENAI_PROXY,

  // Groq API
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  // Concurrency tuning (optional)
  MEDIA_REFRESH_CONCURRENCY: process.env.MEDIA_REFRESH_CONCURRENCY,
  IMAGE_DOWNLOAD_CONCURRENCY: process.env.IMAGE_DOWNLOAD_CONCURRENCY,
  GROUPING_MAX_MESSAGES_PER_CALL: process.env.GROUPING_MAX_MESSAGES_PER_CALL,

  // Target Group Chat ID for Processing
  TARGET_GROUP_ID: process.env.TARGET_GROUP_ID,

  // Message Fetch Configuration

  // Processing Configuration
  PROCESSING_BATCH_SIZE: process.env.PROCESSING_BATCH_SIZE,
  MESSAGE_PROCESSING_HOURS: process.env.MESSAGE_PROCESSING_HOURS,

  // SMS Configuration
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_USE_CONSOLE: process.env.SMS_USE_CONSOLE,
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
