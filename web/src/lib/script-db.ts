import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  scriptPrisma?: PrismaClient;
};

export const scriptPrisma =
  globalForPrisma.scriptPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.scriptPrisma = scriptPrisma;
