import { useEffect, useState } from 'react';

export type OrderChatImage = {
  messageId: string;
  index: number;
  type: string;
  name: string;
  url: string;
};

export type OrderChatImagesByItem = Record<string, OrderChatImage[]>;

export function chatAttachmentsForMessage(
  imagesByItem: OrderChatImagesByItem,
  itemId: string,
  messageId: string
): Array<{ type: string; name: string; url: string }> {
  return (imagesByItem[itemId] ?? [])
    .filter(img => img.messageId === messageId)
    .map(img => ({ type: img.type, name: img.name, url: img.url }));
}

export function chatImagesForItem(
  imagesByItem: OrderChatImagesByItem,
  itemId: string
): OrderChatImage[] {
  return imagesByItem[itemId] ?? [];
}

export function useOrderChatImages(
  orderId: string | null,
  enabled: boolean
): { imagesByItem: OrderChatImagesByItem; loading: boolean } {
  const [imagesByItem, setImagesByItem] = useState<OrderChatImagesByItem>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId || !enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/admin/orders/${orderId}/chat-images`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch chat images');
        return res.json() as Promise<{ items?: OrderChatImagesByItem }>;
      })
      .then(data => {
        if (!cancelled) {
          setImagesByItem(data.items ?? {});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImagesByItem({});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, enabled]);

  return { imagesByItem, loading };
}
