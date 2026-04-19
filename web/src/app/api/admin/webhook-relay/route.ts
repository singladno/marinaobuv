import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db-node';
import { getGreenWebhookPrimaryUrl } from '@/lib/server/green-webhook-relay';
import { requireAuth } from '@/lib/server/auth-helpers';

const SINGLETON_ID = 'singleton';

const putSchema = z.object({
  secondaryUrl: z.union([z.string().url(), z.null()]),
});

/** GET current dev tunnel URL for Green API relay */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const row = await prisma.greenApiWebhookRelayConfig.findUnique({
    where: { id: SINGLETON_ID },
  });

  return NextResponse.json({
    secondaryUrl: row?.secondaryUrl ?? null,
    primaryUrl: getGreenWebhookPrimaryUrl(),
    relayPath: '/api/webhooks/green-api/relay',
  });
}

/** PUT { "secondaryUrl": "https://....ngrok.../api/webhooks/green-api" | null } */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const secondaryUrl = parsed.data.secondaryUrl;

  const row = await prisma.greenApiWebhookRelayConfig.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      secondaryUrl: secondaryUrl ?? null,
    },
    update: { secondaryUrl: secondaryUrl ?? null },
  });

  return NextResponse.json({
    secondaryUrl: row.secondaryUrl,
    primaryUrl: getGreenWebhookPrimaryUrl(),
  });
}
