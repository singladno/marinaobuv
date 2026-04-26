import type {
  OrderActivityActor,
  Prisma,
  SupplierPollMode,
} from '@prisma/client';

import { prisma } from '@/lib/server/db';
import { logWarn } from '@/lib/server/logger';

export type OrderActivityEntryDto = {
  id: string;
  at: string;
  title: string;
  subtitle?: string | null;
  actorLabel: string;
  actorKind:
    | 'CLIENT'
    | 'ADMIN'
    | 'USER'
    | 'SYSTEM'
    | 'AI'
    | 'GRUZCHIK'
    | 'UNKNOWN';
};

export async function logOrderActivity(params: {
  orderId: string;
  kind: string;
  title: string;
  details?: Record<string, unknown>;
  actorType: OrderActivityActor;
  actorUserId?: string | null;
}): Promise<void> {
  try {
    await prisma.orderActivity.create({
      data: {
        orderId: params.orderId,
        kind: params.kind,
        title: params.title,
        details:
          params.details === undefined
            ? undefined
            : (params.details as Prisma.InputJsonValue),
        actorType: params.actorType,
        actorUserId: params.actorUserId ?? undefined,
      },
    });
  } catch (e) {
    logWarn('[order-activity] log failed', e);
  }
}

function formatUserShort(
  u: {
    name: string | null;
    phone: string | null;
  } | null
): string {
  if (!u) return '—';
  const n = u.name?.trim();
  if (n) return n;
  return u.phone ?? '—';
}

function pollModeLabel(mode: SupplierPollMode): string {
  return mode === 'STOCK_AND_INVOICE' ? 'Наличие и счёт' : 'Только наличие';
}

function feedbackTypeLabel(t: string): string {
  switch (t) {
    case 'WRONG_SIZE':
      return 'Неверный размер';
    case 'WRONG_ITEM':
      return 'Неверный товар';
    case 'AGREE_REPLACEMENT':
      return 'Согласие на замену';
    default:
      return t;
  }
}

export async function getOrderActivityTimeline(
  orderId: string
): Promise<OrderActivityEntryDto[] | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      createdAt: true,
      orderNumber: true,
      user: {
        select: { id: true, name: true, phone: true, role: true },
      },
    },
  });
  if (!order) return null;

  const [polls, activities, replacements, feedbacks] = await Promise.all([
    prisma.supplierPollRun.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true, phone: true } },
      },
    }),
    prisma.orderActivity.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        actorUser: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    }),
    prisma.orderItemReplacement.findMany({
      where: { orderItem: { orderId } },
      orderBy: { createdAt: 'asc' },
      include: {
        adminUser: { select: { id: true, name: true, phone: true } },
        orderItem: { select: { name: true, article: true } },
      },
    }),
    prisma.orderItemFeedback.findMany({
      where: { orderItem: { orderId } },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, phone: true, role: true } },
        orderItem: { select: { name: true } },
      },
    }),
  ]);

  type Raw = { t: Date; entry: OrderActivityEntryDto };
  const raw: Raw[] = [];

  raw.push({
    t: order.createdAt,
    entry: {
      id: `synthetic-order-${order.id}`,
      at: order.createdAt.toISOString(),
      title: 'Заказ создан',
      subtitle: `№ ${order.orderNumber}`,
      actorLabel: order.user
        ? formatUserShort(order.user)
        : 'Гость / без учётной записи',
      actorKind:
        order.user?.role === 'CLIENT'
          ? 'CLIENT'
          : order.user
            ? 'USER'
            : 'UNKNOWN',
    },
  });

  for (const p of polls) {
    raw.push({
      t: p.createdAt,
      entry: {
        id: `poll-${p.id}`,
        at: p.createdAt.toISOString(),
        title: 'Опрос поставщиков инициирован',
        subtitle: pollModeLabel(p.mode),
        actorLabel: formatUserShort(p.createdBy),
        actorKind: 'ADMIN',
      },
    });
    if (p.status === 'CANCELLED') {
      raw.push({
        t: p.updatedAt,
        entry: {
          id: `poll-${p.id}-cancelled`,
          at: p.updatedAt.toISOString(),
          title: 'Опрос поставщиков отменён',
          subtitle: 'Исходящие сообщения не отправлены',
          actorLabel: 'Система',
          actorKind: 'SYSTEM',
        },
      });
    }
  }

  for (const a of activities) {
    raw.push({
      t: a.createdAt,
      entry: {
        id: `activity-${a.id}`,
        at: a.createdAt.toISOString(),
        title: a.title,
        subtitle: null,
        actorLabel: mapActorLabel(a.actorType, a.actorUser),
        actorKind: mapActorKind(a.actorType, a.actorUser),
      },
    });
  }

  for (const r of replacements) {
    const auto =
      (r.adminComment ?? '').includes('автоопрос') ||
      (r.adminComment ?? '').includes('авто');
    raw.push({
      t: r.createdAt,
      entry: {
        id: `replacement-${r.id}`,
        at: r.createdAt.toISOString(),
        title: 'Предложение замены',
        subtitle: r.orderItem.name,
        actorLabel: auto
          ? 'ИИ помощник (автоопрос)'
          : formatUserShort(r.adminUser),
        actorKind: auto ? 'AI' : 'ADMIN',
      },
    });
  }

  for (const f of feedbacks) {
    raw.push({
      t: f.createdAt,
      entry: {
        id: `feedback-${f.id}`,
        at: f.createdAt.toISOString(),
        title: `Отзыв клиента: ${feedbackTypeLabel(f.feedbackType)}`,
        subtitle: f.orderItem.name,
        actorLabel: formatUserShort(f.user),
        actorKind:
          f.user.role === 'CLIENT' ? 'CLIENT' : mapRoleToActorKind(f.user.role),
      },
    });
  }

  raw.sort((x, y) => x.t.getTime() - y.t.getTime());
  return raw.map(r => r.entry);
}

function mapRoleToActorKind(role: string): OrderActivityEntryDto['actorKind'] {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'GRUZCHIK') return 'GRUZCHIK';
  if (role === 'CLIENT') return 'CLIENT';
  return 'USER';
}

function mapActorLabel(
  actorType: OrderActivityActor,
  actorUser: {
    name: string | null;
    phone: string | null;
    role: string;
  } | null
): string {
  switch (actorType) {
    case 'AI_ASSISTANT':
      return 'ИИ помощник';
    case 'SYSTEM':
      return 'Система';
    case 'ADMIN':
      return actorUser ? formatUserShort(actorUser) : 'Администратор';
    case 'USER':
      return actorUser ? formatUserShort(actorUser) : 'Пользователь';
    default:
      return actorUser ? formatUserShort(actorUser) : '—';
  }
}

function mapActorKind(
  actorType: OrderActivityActor,
  actorUser: { role: string } | null
): OrderActivityEntryDto['actorKind'] {
  switch (actorType) {
    case 'AI_ASSISTANT':
      return 'AI';
    case 'SYSTEM':
      return 'SYSTEM';
    case 'ADMIN':
      return 'ADMIN';
    case 'USER':
      return actorUser ? mapRoleToActorKind(actorUser.role) : 'USER';
    default:
      return 'UNKNOWN';
  }
}
