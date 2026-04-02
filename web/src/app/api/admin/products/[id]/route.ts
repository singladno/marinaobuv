import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getProductById } from '../product-service';
import { productInclude } from '../product-includes';
import { logRequestError } from '@/lib/server/request-logging';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    logRequestError(req, '/api/admin/products/[id]', error, 'Error fetching product:');
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
