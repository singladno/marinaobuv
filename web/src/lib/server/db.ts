import { PrismaClient } from '@prisma/client';

/** Max SQL chars per prisma:query line in development (avoids multi‑KB IN/VALUES spam). */
const PRISMA_QUERY_LOG_MAX = 480;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isDev = process.env.NODE_ENV === 'development';
  /** Opt-in: set PRISMA_LOG_QUERIES=1 in .env.local to debug SQL (off by default — too noisy). */
  const logQueries =
    isDev &&
    (process.env.PRISMA_LOG_QUERIES === '1' ||
      process.env.PRISMA_LOG_QUERIES === 'true');

  const client = new PrismaClient({
    log: logQueries
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : isDev
        ? ['error', 'warn']
        : ['error'],
  });

  if (logQueries) {
    client.$on('query', e => {
      const q =
        e.query.length > PRISMA_QUERY_LOG_MAX
          ? `${e.query.slice(0, PRISMA_QUERY_LOG_MAX)}… [truncated, ${e.query.length} chars]`
          : e.query;
      console.log(`prisma:query ${e.duration}ms ${q}`);
    });
  }

  return client;
}

function getPrismaClient(): PrismaClient {
  let client = globalForPrisma.prisma ?? createPrismaClient();
  // After `prisma generate`, new models appear on the client class — but dev may still
  // hold a pre-generate instance on globalThis, so `prisma.supplierPollRun` is undefined.
  if (
    process.env.NODE_ENV !== 'production' &&
    typeof (client as unknown as { supplierPollRun?: unknown })
      .supplierPollRun === 'undefined'
  ) {
    client = createPrismaClient();
    globalForPrisma.prisma = client;
  } else if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
