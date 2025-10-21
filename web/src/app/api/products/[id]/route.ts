import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  return NextResponse.json({ product });
}
