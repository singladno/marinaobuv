import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';
import { logServerError } from '@/lib/server/logger';
import {
  prepareSupplierPollOutbound,
  runSupplierPollOutboundWork,
} from '@/lib/supplier-poll/execute-supplier-poll-outbound';
import type { SupplierPollMode } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) return auth.error;

    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const modeRaw = body?.mode;

    const mode: SupplierPollMode =
      modeRaw === 'STOCK_AND_INVOICE' ? 'STOCK_AND_INVOICE' : 'STOCK_ONLY';

    const { runId } = await prepareSupplierPollOutbound({
      orderId,
      mode,
      createdByUserId: auth.user.id,
    });

    after(() => {
      void runSupplierPollOutboundWork(runId).catch((e: unknown) => {
        logServerError(
          '[supplier-poll] background outbound failed:',
          e ?? new Error(String(e))
        );
      });
    });

    return NextResponse.json({
      success: true,
      runId,
      background: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg === 'IN_PROGRESS_POLL_EXISTS') {
      return NextResponse.json(
        {
          success: false,
          error:
            'По этому заказу уже есть активный опрос поставщиков. Дождитесь завершения или отмените его.',
        },
        { status: 409 }
      );
    }
    if (msg === 'GREEN_API_ADMIN_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Green API (админ WhatsApp) не настроен на сервере',
        },
        { status: 503 }
      );
    }
    if (msg === 'ORDER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Заказ не найден' },
        { status: 404 }
      );
    }
    if (msg === 'NO_PROVIDER_ITEMS') {
      return NextResponse.json(
        {
          success: false,
          error: 'Нет позиций с привязанным поставщиком',
        },
        { status: 400 }
      );
    }

    logRequestError(
      request,
      '/api/admin/orders/[id]/supplier-poll',
      e,
      'supplier-poll failed:'
    );
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
