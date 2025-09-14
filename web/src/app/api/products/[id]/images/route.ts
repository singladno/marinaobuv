import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getPublicUrl } from '@/lib/storage';

const BodySchema = z.object({
  key: z.string().min(1),
  publicUrl: z.string().url().optional(),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
  sort: z.number().int().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await req.json();
    const body = BodySchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ ok: false, error: 'Invalid body', details: body.error.flatten() }, { status: 400 });
    }
    const productId = id;
    const { key, publicUrl, alt, isPrimary, sort, width, height } = body.data;
    const url = publicUrl ?? getPublicUrl(key);

    const result = await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.productImage.updateMany({ where: { productId, isPrimary: true }, data: { isPrimary: false } });
      }
      const img = await tx.productImage.create({
        data: {
          productId,
          url,
          key,
          alt,
          isPrimary: isPrimary ?? false,
          sort: sort ?? 0,
          width,
          height,
        },
        select: { id: true },
      });
      return img.id;
    });

    return NextResponse.json({ ok: true, imageId: result });
  } catch (e: any) {
    console.error('save image error', e);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

// TODO: Secure this endpoint with admin authentication
