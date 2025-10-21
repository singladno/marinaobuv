// import type { DraftSize } from '@/types/admin';

/**
 * Calculate total pairs from sizes array
 * Handles both DraftSize format (with isActive) and Draft.sizes format (without isActive)
 */
export function calculateTotalPairs(
  sizes: Array<{
    size: string;
    count?: number;
    quantity?: number;
    stock?: number;
    isActive?: boolean;
  }>
): number {
  if (!sizes || sizes.length === 0) {
    return 0;
  }

  return sizes.reduce((total, size) => {
    // Handle DraftSize format (with isActive field)
    if ('isActive' in size && !size.isActive) {
      return total;
    }

    // Handle common quantity fields across sources
    const quantity =
      (typeof size.quantity === 'number' ? size.quantity : undefined) ??
      (typeof size.count === 'number' ? size.count : undefined) ??
      (typeof size.stock === 'number' ? size.stock : undefined) ??
      0;
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
