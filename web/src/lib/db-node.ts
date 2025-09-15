import { PrismaClient } from '@prisma/client';

// Node-safe Prisma client for scripts (no `server-only` import)
let prismaSingleton: PrismaClient | undefined = undefined;

export const prisma: PrismaClient =
  prismaSingleton ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
prismaSingleton = prisma;
