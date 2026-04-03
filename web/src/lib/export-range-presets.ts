export const EXPORT_RANGE_PRESETS = [
  'all',
  '1d',
  '3d',
  '7d',
  '30d',
] as const;

export type ExportRangePreset = (typeof EXPORT_RANGE_PRESETS)[number];

const MS_DAY = 86_400_000;

/**
 * Rolling window ending at `now`: products with createdAt or updatedAt in
 * [dateFrom, dateTo] should match export filter (inclusive).
 */
export function exportRangeToDates(
  preset: ExportRangePreset,
  now = new Date()
): { dateFrom: Date; dateTo: Date } | null {
  if (preset === 'all') return null;
  const days: Record<Exclude<ExportRangePreset, 'all'>, number> = {
    '1d': 1,
    '3d': 3,
    '7d': 7,
    '30d': 30,
  };
  const n = days[preset];
  const dateTo = new Date(now.getTime());
  const dateFrom = new Date(now.getTime() - n * MS_DAY);
  return { dateFrom, dateTo };
}

export function parseExportRangePreset(raw: unknown): ExportRangePreset | null {
  if (raw === undefined || raw === null || raw === '') return 'all';
  if (typeof raw !== 'string') return null;
  return (EXPORT_RANGE_PRESETS as readonly string[]).includes(raw)
    ? (raw as ExportRangePreset)
    : null;
}
