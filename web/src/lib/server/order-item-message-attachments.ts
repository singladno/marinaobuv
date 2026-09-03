import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/server/db';

export type AttachmentMeta = {
  index: number;
  type: string;
  name: string;
  size?: number;
  hasData: boolean;
  httpUrl?: string;
};

export type AttachmentBinary = {
  bytes: Buffer;
  contentType: string;
};

export type OrderChatImage = {
  messageId: string;
  index: number;
  type: string;
  name: string;
  url: string;
};

const DATA_URL_RE = /^data:([^;,]+);base64,([\s\S]+)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAttachments(
  raw: Prisma.JsonValue | null | undefined
): Record<string, unknown>[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(isRecord);
}

export function listAttachmentMeta(
  raw: Prisma.JsonValue | null | undefined
): AttachmentMeta[] {
  return parseAttachments(raw).map((att, index) => {
    const type =
      typeof att.type === 'string' ? att.type : 'application/octet-stream';
    const name = typeof att.name === 'string' ? att.name : 'file';
    const size = typeof att.size === 'number' ? att.size : undefined;
    const data = typeof att.data === 'string' ? att.data : '';
    const url = typeof att.url === 'string' ? att.url : '';
    return {
      index,
      type,
      name,
      size,
      hasData: data.length > 0,
      httpUrl: url.startsWith('http') ? url : undefined,
    };
  });
}

export function publicAttachmentUrl(
  itemId: string,
  messageId: string,
  index: number
): string {
  return `/api/admin/order-items/${itemId}/messages/${messageId}/attachments/${index}`;
}

export function chatImageSrc(
  itemId: string,
  messageId: string,
  meta: AttachmentMeta
): string | null {
  if (meta.httpUrl) return meta.httpUrl;
  if (meta.hasData) return publicAttachmentUrl(itemId, messageId, meta.index);
  return null;
}

export function getAttachmentBinary(
  raw: Prisma.JsonValue | null | undefined,
  index: number
): AttachmentBinary | null {
  const att = parseAttachments(raw)[index];
  if (!att) return null;
  const data = typeof att.data === 'string' ? att.data : '';
  const match = DATA_URL_RE.exec(data);
  if (match) {
    return {
      bytes: Buffer.from(match[2], 'base64'),
      contentType: match[1],
    };
  }
  if (data && !data.startsWith('http')) {
    const type =
      typeof att.type === 'string' ? att.type : 'application/octet-stream';
    return { bytes: Buffer.from(data, 'base64'), contentType: type };
  }
  return null;
}

type ChatImageSqlRow = {
  messageId: string;
  orderItemId: string;
  meta: unknown;
};

function metaFromSql(raw: unknown): Array<Record<string, unknown>> {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(isRecord);
}

export async function listOrderChatImages(
  orderId: string
): Promise<Record<string, OrderChatImage[]>> {
  const rows = await prisma.$queryRaw<ChatImageSqlRow[]>`
    WITH ranked AS (
      SELECT
        m.id,
        m."orderItemId",
        ROW_NUMBER() OVER (
          PARTITION BY m."orderItemId" ORDER BY m."createdAt" DESC
        ) AS rn,
        CASE
          WHEN jsonb_typeof(m.attachments) = 'array' THEN (
            SELECT COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'index', (ord - 1),
                  'type', COALESCE(e->>'type', 'application/octet-stream'),
                  'name', COALESCE(e->>'name', 'file'),
                  'hasData', jsonb_exists(e, 'data'),
                  'httpUrl', CASE
                    WHEN (e->>'url') LIKE 'http%' THEN e->>'url'
                    ELSE NULL
                  END
                )
              ),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(m.attachments) WITH ORDINALITY AS t(e, ord)
          )
          ELSE '[]'::jsonb
        END AS meta
      FROM "OrderItemMessage" m
      INNER JOIN "OrderItem" oi ON oi.id = m."orderItemId"
      WHERE oi."orderId" = ${orderId}
    )
    SELECT id AS "messageId", "orderItemId", meta
    FROM ranked
    WHERE rn <= 5
  `;

  const items: Record<string, OrderChatImage[]> = {};
  for (const row of rows) {
    const list = items[row.orderItemId] ?? [];
    for (const entry of metaFromSql(row.meta)) {
      const index = typeof entry.index === 'number' ? entry.index : -1;
      const type =
        typeof entry.type === 'string'
          ? entry.type
          : 'application/octet-stream';
      const name = typeof entry.name === 'string' ? entry.name : 'file';
      const httpUrl =
        typeof entry.httpUrl === 'string' ? entry.httpUrl : undefined;
      const hasData = Boolean(entry.hasData);
      const url =
        httpUrl ||
        (hasData && index >= 0
          ? publicAttachmentUrl(row.orderItemId, row.messageId, index)
          : null);
      if (!url) continue;
      if (!type.startsWith('image/')) continue;
      list.push({
        messageId: row.messageId,
        index,
        type,
        name,
        url,
      });
    }
    if (list.length > 0) {
      items[row.orderItemId] = list;
    }
  }
  return items;
}
