/**
 * Utility functions for pricing calculations in the basket
 */

export interface ProductSizes {
  size: string;
  count: number;
}

export interface CartItem {
  qty: number;
  product: {
    pricePair: number;
    sizes: ProductSizes[];
  };
}

/**
 * Calculate the total amount of sizes (total count across all sizes)
 */
export function calculateAmountOfSizes(sizes: ProductSizes[]): number {
  return sizes.reduce((total, size) => total + size.count, 0);
}

/**
 * Calculate price per box (price per pair * amount of sizes)
 */
export function calculatePricePerBox(
  pricePair: number,
  sizes: ProductSizes[]
): number {
  const amountOfSizes = calculateAmountOfSizes(sizes);
  return pricePair * amountOfSizes;
}

/**
 * Calculate total price for a cart item (price per pair * quantity)
 */
export function calculateItemTotal(pricePair: number, qty: number): number {
  return pricePair * qty;
}

/**
 * Calculate total box price for a cart item (price per box * quantity)
 */
export function calculateItemBoxTotal(
  pricePair: number,
  sizes: ProductSizes[],
  qty: number
): number {
  const pricePerBox = calculatePricePerBox(pricePair, sizes);
  return pricePerBox * qty;
}

/**
 * Calculate total boxes across all cart items
 * Each product represents one box, regardless of how many pairs are in it
 */
export function calculateTotalBoxes(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.qty;
  }, 0);
}

/**
 * Calculate total box price across all cart items
 */
export function calculateTotalBoxPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return (
      sum +
      calculateItemBoxTotal(
        item.product.pricePair,
        item.product.sizes,
        item.qty
      )
    );
  }, 0);
}

/**
 * Calculate subtotal (pairs) across all cart items
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.product.pricePair, item.qty);
  }, 0);
}
