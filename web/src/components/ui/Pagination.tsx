import { buildQueryString } from '@/lib/filters';
import type { CatalogFilters } from '@/types/filters';

type Props = {
  basePath: string; // e.g., /catalog or /catalog/season/boots
  total: number;
  page: number;
  pageSize: number;
  filters?: CatalogFilters;
  categoryId?: string;
};

export default function Pagination({
  basePath,
  total,
  page,
  pageSize,
  filters,
  categoryId,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1;
        const queryParams: { page: number; categoryId?: string } = { page: n };
        if (categoryId) {
          queryParams.categoryId = categoryId;
        }
        const href = `${basePath}${buildQueryString(queryParams, filters ? { ...filters, categoryId } : undefined)}`;
        const isActive = n === page;
        return (
          <a
            key={n}
            href={href}
            className={`border-border shadow-xs rounded-md border px-3 py-1.5 transition ${
              isActive
                ? 'bg-primary border-transparent text-white'
                : 'bg-surface text-foreground hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]'
            }`}
          >
            {n}
          </a>
        );
      })}
    </div>
  );
}
