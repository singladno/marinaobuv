/**
 * Generates a unique item code for order items
 * Format: ITM-YYYYMMDD-HHMMSS-XXXX
 * Example: ITM-20250126-143022-0001
 */
export function generateItemCode(): string {
  const now = new Date();

  // Format: YYYYMMDD
  const date =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  // Format: HHMMSS
  const time =
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  // Generate random 4-digit number
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `ITM-${date}-${time}-${random}`;
}

/**
 * Generates multiple unique item codes
 */
export function generateItemCodes(count: number): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateItemCode());
  }

  return Array.from(codes);
}
