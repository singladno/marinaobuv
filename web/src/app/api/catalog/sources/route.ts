import { ProductSource } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';

function formatWhatsAppChatLabel(chatId: string): string {
  if (chatId.endsWith('@g.us')) return `Группа ${chatId.replace('@g.us', '')}`;
  if (chatId.endsWith('@c.us')) return `Чат ${chatId.replace('@c.us', '')}`;
  return chatId;
}

export type CatalogSourceItem = {
  id: string;
  type: 'WA' | 'TG' | 'AG' | 'MANUAL';
  name: string;
};

/**
 * GET /api/catalog/sources
 * Returns distinct sources (by type + chat) for catalog filter dropdown.
 * Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error || auth.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const baseWhere = {
      OR: [
        { batchProcessingStatus: 'completed' },
        { source: ProductSource.MANUAL },
        { source: ProductSource.AG },
      ],
    };

    const items: CatalogSourceItem[] = [];

    // WA: distinct chatIds from products that have WA source and sourceMessageIds
    const waProducts = await prisma.product.findMany({
      where: { ...baseWhere, source: ProductSource.WA },
      select: { sourceMessageIds: true },
    });
    const waMsgIds = new Set<string>();
    for (const p of waProducts) {
      const ids = Array.isArray(p.sourceMessageIds)
        ? (p.sourceMessageIds as string[])
        : [];
      ids.forEach((id: string) => waMsgIds.add(id));
    }
    if (waMsgIds.size > 0) {
      const waMessages = await prisma.whatsAppMessage.findMany({
        where: { id: { in: Array.from(waMsgIds) } },
        select: { chatId: true },
      });
      const waChatIds = [...new Set(waMessages.map(m => m.chatId).filter(Boolean))] as string[];
      if (waChatIds.length > 0) {
        const waChats = await prisma.whatsAppChat.findMany({
          where: { chatId: { in: waChatIds } },
          select: { chatId: true, name: true },
        });
        const nameByChatId = Object.fromEntries(
          waChats.map(c => [c.chatId, (c.name && c.name.trim()) || formatWhatsAppChatLabel(c.chatId)])
        );
        for (const chatId of waChatIds) {
          items.push({
            id: `WA:${chatId}`,
            type: 'WA',
            name: nameByChatId[chatId] ?? formatWhatsAppChatLabel(chatId),
          });
        }
      }
    }

    // TG: distinct chatIds from products that have TG source
    const tgProducts = await prisma.product.findMany({
      where: { ...baseWhere, source: ProductSource.TG },
      select: { sourceMessageIds: true },
    });
    const tgMsgIds = new Set<string>();
    for (const p of tgProducts) {
      const ids = Array.isArray(p.sourceMessageIds)
        ? (p.sourceMessageIds as string[])
        : [];
      ids.forEach((id: string) => tgMsgIds.add(id));
    }
    if (tgMsgIds.size > 0) {
      const tgMessages = await prisma.telegramMessage.findMany({
        where: { id: { in: Array.from(tgMsgIds) } },
        select: { chatId: true },
      });
      const tgChatIds = [...new Set(tgMessages.map(m => m.chatId).filter(Boolean))] as string[];
      for (const chatId of tgChatIds) {
        items.push({
          id: `TG:${chatId}`,
          type: 'TG',
          name: `Чат ${chatId}`,
        });
      }
    }

    // AG and MANUAL (static)
    const hasAg = await prisma.product.findFirst({
      where: { ...baseWhere, source: ProductSource.AG },
      select: { id: true },
    });
    if (hasAg) {
      items.push({ id: 'AG', type: 'AG', name: 'Агрегатор' });
    }
    const hasManual = await prisma.product.findFirst({
      where: { ...baseWhere, source: ProductSource.MANUAL },
      select: { id: true },
    });
    if (hasManual) {
      items.push({ id: 'MANUAL', type: 'MANUAL', name: 'Вручную' });
    }

    // Sort: WA first (by name), then TG, then AG, then MANUAL
    items.sort((a, b) => {
      const order = { WA: 0, TG: 1, AG: 2, MANUAL: 3 };
      if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ sources: items });
  } catch (e) {
    console.error('Catalog sources error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
