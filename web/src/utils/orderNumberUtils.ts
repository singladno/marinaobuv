/**
 * Utility functions for handling order numbers
 */

/**
 * Removes ORD- prefix from order number if present
 * @param orderNumber - The order number (may or may not have ORD- prefix)
 * @returns The order number without ORD- prefix
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.replace(/^ORD-/, '');
}

/**
 * Formats order number for display with # prefix
 * @param orderNumber - The order number
 * @returns Formatted order number for display (e.g., "#10007")
 */
export function formatOrderNumberForDisplay(orderNumber: string): string {
  return `#${formatOrderNumber(orderNumber)}`;
}

/** Russian plural form for «заказ» (1 заказ, 2 заказа, 5 заказов). */
export function pluralOrdersRu(count: number): string {
  const n = Math.abs(Math.floor(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'заказов';
  if (mod10 === 1) return 'заказ';
  if (mod10 >= 2 && mod10 <= 4) return 'заказа';
  return 'заказов';
}

export function formatBulkOrdersDeletedMessage(count: number): string {
  return `Удалено ${count} ${pluralOrdersRu(count)}`;
}
