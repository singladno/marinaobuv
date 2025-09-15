import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  const products = await prisma.product.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ products });
}
