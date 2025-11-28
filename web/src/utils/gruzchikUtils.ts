import type { GruzchikOrder, GruzchikOrderItemRow } from '@/types/gruzchik';

// Helper function to flatten orders into item rows
export function flattenOrdersToItems(
  orders: GruzchikOrder[]
): GruzchikOrderItemRow[] {
  const itemRows: GruzchikOrderItemRow[] = [];

  orders.forEach(order => {
    order.items.forEach(item => {
      itemRows.push({
        // Order info
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        orderStatus: order.status,
        orderLabel: order.label,
        orderPayment: order.payment,
        orderTotal: order.total,

        // Customer info
        customerName: order.fullName,
        customerPhone: order.phone,

        // Item info
        itemId: item.id,
        productId: item.productId,
        itemName: item.name,
        itemArticle: item.product.article,
        itemQty: item.qty,
        itemPrice: item.priceBox,
        itemCode: item.itemCode,
        itemColor: item.color || null,
        // Filter images by ordered color
        itemImage: (() => {
          const normalize = (s?: string | null) => (s || '').trim().toLowerCase();
          const itemColor = normalize(item.color);
          if (itemColor && item.product.images) {
            const filtered = item.product.images.filter(img =>
              normalize(img.color) === itemColor
            );
            return filtered[0]?.url || item.product.images[0]?.url || null;
          }
          return item.product.images?.[0]?.url || null;
        })(),
        itemImages: (() => {
          const normalize = (s?: string | null) => (s || '').trim().toLowerCase();
          const itemColor = normalize(item.color);
          if (itemColor && item.product.images) {
            const filtered = item.product.images.filter(img =>
              normalize(img.color) === itemColor
            );
            return filtered.length > 0
              ? filtered.map(img => img.url)
              : item.product.images.map(img => img.url);
          }
          return item.product.images?.map(img => img.url) || [];
        })(),

        // Product details
        pricePair: item.product.pricePair,
        sizes: item.product.sizes,

        // Availability info
        isAvailable: item.isAvailable,
        // Purchase info
        isPurchased: item.isPurchased,

        // WhatsApp message info
        messageId: item.messageId,
        messageText: item.messageText,
        messageDate: item.messageDate,

        // Provider info
        provider: item.product.provider?.name || 'Неизвестный поставщик',
        providerId: item.product.providerId,
      });
    });
  });

  return itemRows;
}
