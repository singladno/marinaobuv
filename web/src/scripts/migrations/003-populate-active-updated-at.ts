import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
  console.log('🚀 Running migration: 003-populate-active-updated-at');

  try {
    // Get all products to update their activeUpdatedAt to match createdAt
    const products = await prisma.product.findMany({
      select: {
        id: true,
        createdAt: true,
        activeUpdatedAt: true,
      },
    });

    console.log(`Found ${products.length} products to update`);

    // Update each product to set activeUpdatedAt to createdAt
    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          activeUpdatedAt: product.createdAt,
        },
      });
    }

    console.log(`✅ Updated activeUpdatedAt for ${products.length} products`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function down() {
  console.log('🔄 Rolling back migration: 003-populate-active-updated-at');

  try {
    // Reset activeUpdatedAt to createdAt for all products (since we can't set to null)
    const products = await prisma.product.findMany({
      select: {
        id: true,
        createdAt: true,
      },
    });

    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          activeUpdatedAt: product.createdAt,
        },
      });
    }

    console.log('✅ Reset activeUpdatedAt for all products');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
