/**
 * Check if a string is a valid number
 */
function isNumeric(str: string): boolean {
  return !isNaN(parseFloat(str));
}

/**
 * Compare numeric sizes
 */
function compareNumericSizes(numA: number, numB: number): number {
  return numA - numB;
}

/**
 * Compare mixed sizes (one numeric, one string)
 */
function compareMixedSizes(isNumA: boolean, isNumB: boolean): number {
  if (isNumA && !isNumB) return -1;
  if (!isNumA && isNumB) return 1;
  return 0;
}

/**
 * Compare two size strings for sorting
 */
function compareSizes(sizeA: string, sizeB: string): number {
  // Handle empty sizes - put them at the end
  if (!sizeA && !sizeB) return 0;
  if (!sizeA) return 1;
  if (!sizeB) return -1;

  const numA = parseFloat(sizeA);
  const numB = parseFloat(sizeB);
  const isNumA = isNumeric(sizeA);
  const isNumB = isNumeric(sizeB);

  // If both are valid numbers, compare numerically
  if (isNumA && isNumB) {
    return compareNumericSizes(numA, numB);
  }

  // If one is a number and the other isn't, numbers come first
  const mixedResult = compareMixedSizes(isNumA, isNumB);
  if (mixedResult !== 0) return mixedResult;

  // If neither are numbers, compare as strings
  return sizeA.localeCompare(sizeB, undefined, { numeric: true });
}

/**
 * Utility function to sort size strings in ascending order
 * Handles numeric sizes properly (e.g., "38", "39", "40" instead of "38", "4", "40")
 */
export function sortSizesAscending<T extends { size: string }>(
  sizes: T[]
): T[] {
  return [...sizes].sort((a, b) => compareSizes(a.size.trim(), b.size.trim()));
}
