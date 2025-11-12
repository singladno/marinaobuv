import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const created = await prisma.productImage.create({
    data: {
      productId: id,
      url: data.url,
      alt: data.alt ?? null,
      color: data.color ?? null,
      sort: data.sort ?? 0,
      isPrimary: !!data.isPrimary,
    },
  });
  return NextResponse.json({ image: created });
}

// TODO: Secure this endpoint with admin authentication
