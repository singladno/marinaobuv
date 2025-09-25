import type { DraftSize } from '@/types/admin';

/**
 * Calculate total pairs from sizes array
 * Handles both DraftSize format (with isActive) and Draft.sizes format (without isActive)
 */
export function calculateTotalPairs(sizes: any): number {
  if (!sizes || sizes.length === 0) {
    return 0;
  }

  return sizes.reduce((total, size) => {
    // Handle DraftSize format (with isActive field)
    if ('isActive' in size && !size.isActive) {
      return total;
    }

    // Handle both quantity and count fields
    const quantity = size.quantity || size.count || size.stock || 0;
    return total + quantity;
  }, 0);
}

/**
 * Calculate box price from pair price and total pairs
 */
export function calculateBoxPrice(
  pricePair: number | null,
  totalPairs: number
): number | null {
  if (!pricePair || totalPairs === 0) {
    return null;
  }

  return pricePair * totalPairs;
}
