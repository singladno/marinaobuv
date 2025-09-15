import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  return NextResponse.json({ product });
}
