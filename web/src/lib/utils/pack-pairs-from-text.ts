/**
 * Sum of pair counts from structured sizes (sizes-extraction GPT output).
 */

export function sumSizeCounts(
  sizes: Array<{ size: string; count: number }>
): number {
  return sizes.reduce((a, s) => a + (Number(s.count) || 0), 0);
}
