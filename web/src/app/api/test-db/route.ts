import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  const now = await prisma.$queryRawUnsafe<Date>('select now()');
  return NextResponse.json({ ok: true, now });
}
