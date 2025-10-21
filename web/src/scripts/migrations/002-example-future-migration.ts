#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
  console.log('🚀 Running migration: 002-example-future-migration');

  try {
    console.log('🔄 Adding user preferences system...');

    // Example: Add user preferences to existing users
    const users = await prisma.user.findMany();

    for (const user of users) {
      // This is just an example - you would create actual preferences logic here
      console.log(`  📝 Processing user: ${user.name || user.phone}`);
    }

    console.log(`✅ Processed ${users.length} users`);
    console.log(
      '✅ Migration 002-example-future-migration completed successfully!'
    );
  } catch (error) {
    console.error('❌ Migration 002-example-future-migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function down() {
  console.log('🔄 Rolling back migration: 002-example-future-migration');

  try {
    console.log('🔄 Removing user preferences...');

    // Example rollback logic
    console.log('✅ Rollback 002-example-future-migration completed');
  } catch (error) {
    console.error('❌ Rollback 002-example-future-migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
