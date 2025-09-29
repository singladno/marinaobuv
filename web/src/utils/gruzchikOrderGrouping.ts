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
    return {
      orderId,
      orderNumber: items[0]?.orderNumber || 'Unknown',
      orderDate: items[0]?.orderDate || '',
      customerName: items[0]?.customerName || 'Не указано',
      customerPhone: items[0]?.customerPhone || '',
      orderTotal: items[0]?.orderTotal || 0,
      items,
    };
  });
}
