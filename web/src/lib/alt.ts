export function productAlt(p: { name: string; article?: string | null }): string {
  const base = p.name.trim();
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? '';
  return p.article ? `${base}, артикул ${p.article} — ${brand}` : `${base} — ${brand}`;
}
