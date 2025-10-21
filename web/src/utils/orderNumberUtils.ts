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
