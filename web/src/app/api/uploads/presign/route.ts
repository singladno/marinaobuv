import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getObjectKey, getPublicUrl, presignPut } from '@/lib/storage';

const BodySchema = z.object({
  productId: z.string().min(1),
  contentType: z.string().min(1),
  ext: z.string().min(1),
  isPrimary: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = BodySchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid body', details: body.error.flatten() },
        { status: 400 }
      );
    }
    const { productId, contentType, ext, isPrimary, sort } = body.data;
    const key = getObjectKey({ productId, ext });
    const uploadUrl = await presignPut(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      ok: true,
      uploadUrl,
      key,
      publicUrl,
      fields: { productId, isPrimary: isPrimary ?? false, sort: sort ?? 0 },
    });
  } catch (e: unknown) {
    console.error('presign error', e);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// TODO: Secure this endpoint with admin authentication
