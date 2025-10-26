/**
 * Formats purchase item description according to the template:
 * РАСПРОДАЖА!!! Старая цена - <Старая цена value>
 * <Product's description>
 * Материал: <product's material>
 * Размеры: <text representation of product's sizes>
 */

interface ProductData {
  description?: string | null;
  material?: string | null;
  sizes?: any; // JSON field that can contain various size formats
  pricePair: number;
}

/**
 * Formats sizes array/object into readable text representation
 */
function formatSizes(sizes: any): string {
  if (!sizes) return 'Не указаны';

  // Handle array of size objects like [{size: '36', count: 1}, {size: '38', count: 2}]
  if (Array.isArray(sizes)) {
    if (sizes.length === 0) return 'Не указаны';

    // Check if it's an array of size objects
    if (sizes.every(item => typeof item === 'object' && item.size)) {
      return sizes.map(item => item.size).join(', ');
    }

    // Handle simple string array
    if (sizes.every(item => typeof item === 'string')) {
      return sizes.join(', ');
    }

    return 'Не указаны';
  }

  // Handle object format like { "36": true, "37": true, "38": false }
  if (typeof sizes === 'object') {
    const availableSizes = Object.entries(sizes)
      .filter(([_, available]) => available === true)
      .map(([size, _]) => size);

    if (availableSizes.length === 0) return 'Не указаны';
    return availableSizes.join(', ');
  }

  if (typeof sizes === 'string') {
    return sizes;
  }

  return 'Не указаны';
}

/**
 * Formats purchase item description according to the template
 */
export function formatPurchaseDescription(product: ProductData): string {
  const oldPrice = Math.round(product.pricePair * 1.8);
  const productDescription = product.description || '';
  const material = product.material || 'Не указан';
  const sizesText = formatSizes(product.sizes);

  return `РАСПРОДАЖА!!! Старая цена - ${oldPrice} руб.
${productDescription}
Материал: ${material}
Размеры: ${sizesText}`;
}
