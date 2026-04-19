import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db-node';
import { requireAuth } from '@/lib/server/auth-helpers';
import { batchUnreadCountsForChats } from '@/lib/wa-admin-inbox';

function displayName(c: {
  name: string;
  contactName: string | null;
  chatId: string;
}): string {
  const n = (c.name || '').trim();
  const cn = (c.contactName || '').trim();
  if (n) return n;
  if (cn) return cn;
  return c.chatId;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const chats = await prisma.waAdminChat.findMany({
    orderBy: { lastActivityAt: 'desc' },
  });

  const userId = auth.user.id;
  const chatIds = chats.map(c => c.chatId);
  const unreadMap = await batchUnreadCountsForChats(userId, chatIds);

  const withUnread = chats.map(c => {
    const u = unreadMap.get(c.chatId) ?? { unread: 0, unreadMedia: 0 };
    return {
      id: c.chatId,
      name: displayName({
        name: c.name,
        contactName: c.contactName,
        chatId: c.chatId,
      }),
      contactName: c.contactName ?? undefined,
      type: (c.chatType === 'group' ? 'group' : 'user') as 'user' | 'group',
      lastActivityAt: c.lastActivityAt.toISOString(),
      lastPreview: c.lastPreview,
      unreadCount: u.unread,
      unreadImageCount: u.unreadMedia,
    };
  });

  return NextResponse.json({ chats: withUnread, source: 'db' as const });
}
