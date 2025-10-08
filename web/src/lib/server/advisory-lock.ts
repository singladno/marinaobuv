import { prisma } from './db';

// Simple Postgres advisory lock helpers using Prisma.$queryRaw.
// Use a fixed 64-bit key for the parser; choose any stable number.
const PARSER_LOCK_KEY = BigInt('0x6d6172696e616f62'); // 'marinaob' hex

export async function tryAcquireParserLock(): Promise<boolean> {
  // pg_advisory_lock returns void; we use tryLock to avoid waiting.
  const result = await prisma.$queryRawUnsafe<
    [{ pg_try_advisory_lock: boolean }]
  >(`SELECT pg_try_advisory_lock($1) as pg_try_advisory_lock`, PARSER_LOCK_KEY);
  const ok = Array.isArray(result)
    ? (result as any)[0]?.pg_try_advisory_lock
    : false;
  return !!ok;
}

export async function releaseParserLock(): Promise<void> {
  await prisma.$queryRawUnsafe(
    `SELECT pg_advisory_unlock($1)`,
    PARSER_LOCK_KEY
  );
}
