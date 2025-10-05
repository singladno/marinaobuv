#!/usr/bin/env tsx

import { prisma } from './src/lib/db-node';

async function main() {
  console.log('⚠️  This will delete WhatsApp messages and draft products.');

  await prisma.$transaction([
    // Delete dependent data first
    prisma.waDraftProductImage.deleteMany({}),
    prisma.waDraftProduct.deleteMany({}),
    // Then messages
    prisma.whatsAppMessage.deleteMany({}),
  ]);

  console.log(
    '✅ Cleared waDraftProductImage, waDraftProduct, whatsAppMessage tables'
  );
}

main()
  .catch(err => {
    console.error('❌ Clear failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
