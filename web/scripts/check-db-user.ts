#!/usr/bin/env tsx
/**
 * Prints the PostgreSQL user that the app uses when connecting (same env as Next.js dev).
 * Run from web/: npx tsx scripts/check-db-user.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Same load order as Next.js in development: .env then .env.development.local
dotenv.config({ path: resolve('.env') });
dotenv.config({ path: resolve('.env.development.local'), override: true });

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  const userFromUrl = url.replace(/^[^:]+:\/\/([^:]+)(:.*)?@.*/, '$1');
  const db = url.replace(/^.*\/([^?]+).*/, '$1');
  console.log('From env: DATABASE_URL user =', userFromUrl, '| database =', db);

  try {
    const result = await prisma.$queryRaw<[{ current_user: string }]>`SELECT current_user`;
    console.log('PostgreSQL current_user =', result[0]?.current_user ?? '?');
    if (result[0]?.current_user && result[0].current_user !== userFromUrl) {
      console.log('');
      console.log('⚠️  Mismatch: app env user and actual DB user differ. Run fix script so this user has grants.');
    }
  } catch (e) {
    console.error('Query failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
