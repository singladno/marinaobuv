import { buildQueryString } from '@/lib/filters';
import type { CatalogFilters } from '@/types/filters';

type Props = {
  basePath: string; // e.g., /catalog or /catalog/season/boots
  total: number;
  page: number;
  pageSize: number;
  filters?: CatalogFilters;
};

export default function Pagination({ basePath, total, page, pageSize, filters }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1;
        const href = `${basePath}${buildQueryString({ page: n }, filters)}`;
        const isActive = n === page;
        return (
          <a
            key={n}
            href={href}
            className={`rounded border border-border px-3 py-1 ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-background'}`}
          >
            {n}
          </a>
        );
      })}
    </div>
  );
}
