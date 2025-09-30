import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [orders, gruzchiks] = await Promise.all([
      prisma.order.findMany({
        include: {
          items: true,
          user: { select: { id: true, phone: true, name: true } },
          gruzchik: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.user.findMany({
        where: { role: 'GRUZCHIK' },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ orders, gruzchiks });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, gruzchikId, label, payment } = body as {
      id: string;
      status?: string;
      gruzchikId?: string | null;
      label?: string | null;
      payment?: number | null;
    };

    if (!id)
      return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const data: {
      status?: string;
      label?: string;
      payment?: number;
      gruzchikId?: string;
    } = {};
    if (typeof status === 'string') data.status = status;
    if (label !== undefined && label !== null) data.label = label;
    if (payment !== undefined && payment !== null)
      data.payment = Number(payment) || 0;
    if (gruzchikId !== undefined && gruzchikId !== null)
      data.gruzchikId = gruzchikId;

    const updated = await prisma.order.update({ where: { id }, data });
    return NextResponse.json({ ok: true, order: updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
