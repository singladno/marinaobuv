import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
  console.log('Adding comment field to Order table...');

  await prisma.$executeRaw`
    ALTER TABLE "Order" ADD COLUMN "comment" TEXT;
  `;

  console.log('✅ Added comment field to Order table');
}

export async function down() {
  console.log('Removing comment field from Order table...');

  await prisma.$executeRaw`
    ALTER TABLE "Order" DROP COLUMN "comment";
  `;

  console.log('✅ Removed comment field from Order table');
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
