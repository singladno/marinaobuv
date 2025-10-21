import type { GruzchikOrder, GruzchikOrderItemRow } from '@/types/gruzchik';

export interface OrderGroup {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  orderTotal: number;
  items: GruzchikOrderItemRow[];
}

export function groupOrdersByOrder(
  itemRows: GruzchikOrderItemRow[],
  orders: GruzchikOrder[]
): OrderGroup[] {
  const grouped = new Map<string, GruzchikOrderItemRow[]>();

  itemRows.forEach(item => {
    if (!grouped.has(item.orderId)) {
      grouped.set(item.orderId, []);
    }
    grouped.get(item.orderId)!.push(item);
  });

  return Array.from(grouped.entries()).map(([orderId, items]) => {
    const order = orders.find(o => o.id === orderId);
    // Show only the first item per order (like admin panel)
    const firstItem = items[0];
    return {
      orderId,
      orderNumber: firstItem?.orderNumber || 'Unknown',
      orderDate: firstItem?.orderDate || '',
      customerName: firstItem?.customerName || 'Не указано',
      customerPhone: firstItem?.customerPhone || '',
      orderTotal: firstItem?.orderTotal || 0,
      items: [firstItem], // Only show first item
    };
  });
}
