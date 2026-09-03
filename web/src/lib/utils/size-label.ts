/**
 * Normalize a size cell label from the sizes-extraction LLM.
 * Adjacent dual sizes written with a hyphen ("36-37") become "36/37".
 * Wider spans ("36-41") stay as-is so the prompt can expand them.
 */
export function normalizeSizeLabel(size: string): string {
  const raw = String(size).trim();
  const match = raw.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (!match) return raw;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) !== 1) {
    return raw;
  }
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}/${hi}`;
}

export function normalizeSizeRows(
  sizes: Array<{ size: string; count: number }> | undefined
): Array<{ size: string; count: number }> {
  if (!sizes) return [];
  return sizes.map(row => ({
    size: normalizeSizeLabel(row.size),
    count: Number(row.count),
  }));
}
