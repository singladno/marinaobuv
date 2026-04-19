#!/usr/bin/env tsx
/**
 * Deletes all rows in WaAdminChat (cascades messages + read states via DB FKs).
 * Does not touch WhatsAppMessage / product parser tables.
 *
 * Usage: cd web && npx tsx scripts/clear-wa-admin-inbox.ts
 * Requires DATABASE_URL in .env
 */

import '../src/scripts/load-env';
import { prisma } from '../src/lib/db-node';

async function main() {
  const deleted = await prisma.waAdminChat.deleteMany({});
  console.log(
    `Deleted ${deleted.count} WaAdminChat row(s) (messages/read states cascade).`
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
