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
        itemName: item.name,
        itemArticle: item.article,
        itemQty: item.qty,
        itemPrice: item.priceBox,
        itemCode: item.itemCode,
        itemImage: item.product.image,

        // WhatsApp message info
        messageId: item.messageId,
        messageText: item.messageText,
        messageDate: item.messageDate,
      });
    });
  });

  return itemRows;
}
