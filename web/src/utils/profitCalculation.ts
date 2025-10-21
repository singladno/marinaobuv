import type { AdminOrder } from '@/hooks/useOrders';

/**
 * Calculates profit for an order based on the number of boxes
 * Formula: number of boxes * 500
 */
export function calculateOrderProfit(order: AdminOrder): number {
  const totalBoxes = order.items.reduce((sum, item) => sum + item.qty, 0);
  return totalBoxes * 500;
}

/**
 * Formats profit amount for display
 */
export function formatProfit(profit: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(profit);
}
