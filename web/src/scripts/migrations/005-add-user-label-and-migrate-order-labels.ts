import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
  console.log(
    '🚀 Running migration: 005-add-user-label-and-migrate-order-labels'
  );

  try {
    // Step 1: Add label field to User table (if not exists)
    console.log('📝 Adding label field to User table...');
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "label" TEXT;
    `;
    console.log('✅ User label field added');

    // Step 2: Migrate existing order labels to user labels
    console.log('🔄 Migrating existing order labels to user labels...');

    // Get all orders with labels and their associated users
    const ordersWithLabels = await prisma.order.findMany({
      where: {
        label: { not: null },
        userId: { not: null },
      },
      select: {
        id: true,
        label: true,
        userId: true,
        user: {
          select: {
            id: true,
            label: true,
          },
        },
      },
    });

    console.log(`📊 Found ${ordersWithLabels.length} orders with labels`);

    // Group by user and get the most recent label for each user
    const userLabels = new Map<string, string>();

    for (const order of ordersWithLabels) {
      if (order.userId && order.label) {
        // If user doesn't have a label yet, or if this order is more recent, use this label
        if (!userLabels.has(order.userId) || !order.user?.label) {
          userLabels.set(order.userId, order.label);
        }
      }
    }

    console.log(`👥 Found ${userLabels.size} users to update with labels`);

    // Update users with their labels
    for (const [userId, label] of userLabels) {
      await prisma.user.update({
        where: { id: userId },
        data: { label },
      });
      console.log(`✅ Updated user ${userId} with label: ${label}`);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function down() {
  console.log(
    '🔄 Rolling back migration: 005-add-user-label-and-migrate-order-labels'
  );

  try {
    // Remove label field from User table
    console.log('📝 Removing label field from User table...');
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      DROP COLUMN IF EXISTS "label";
    `;
    console.log('✅ User label field removed');

    console.log('✅ Rollback completed');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
