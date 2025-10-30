import Link from 'next/link';
import { useMemo } from 'react';
import { buildQueryString } from '@/lib/filters';

type CatalogPaginationProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  filters?: any;
  categoryId?: string;
};

function getPages(current: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  const addRange = (from: number, to: number) => {
    for (let i = from; i <= to; i++) pages.push(i);
  };
  pages.push(1);
  if (current > 4) pages.push('ellipsis');
  addRange(Math.max(2, current - 1), Math.min(totalPages - 1, current + 1));
  if (current < totalPages - 3) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export default function CatalogPagination({
  basePath,
  page,
  pageSize,
  total,
  filters,
  categoryId,
}: CatalogPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = useMemo(() => getPages(page, totalPages), [page, totalPages]);

  const buildHref = (n: number) => {
    const queryParams: { page: number; categoryId?: string } = { page: n };
    if (categoryId) queryParams.categoryId = categoryId;
    return `${basePath}${buildQueryString(queryParams, filters ? { ...filters, categoryId } : undefined)}`;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 w-full">
      {/* Desktop: numbers centered, full labels sides */}
      <div className="hidden w-full items-center justify-between sm:flex">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-label="Предыдущая страница"
          className="text-primary transition-colors duration-200 hover:text-purple-700"
        >
          ← Предыдущая страница
        </Link>

        <ul className="flex items-center gap-6">
          {items.map((it, idx) => (
            <li key={`${it}-${idx}`}>
              {it === 'ellipsis' ? (
                <span className="text-foreground/60 px-2">…</span>
              ) : (
                <Link
                  href={buildHref(it)}
                  aria-current={it === page ? 'page' : undefined}
                  className={
                    it === page
                      ? 'flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 !text-white transition-colors duration-200'
                      : 'text-foreground flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]'
                  }
                >
                  {it}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-label="Следующая страница"
          className="text-primary transition-colors duration-200 hover:text-purple-700"
        >
          Следующая страница →
        </Link>
      </div>

      {/* Mobile: compact arrows + numbers */}
      <div className="flex items-center gap-4 sm:hidden">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-label="Предыдущая страница"
          className="text-primary transition-colors duration-200 hover:text-purple-700"
        >
          ←
        </Link>

        <ul className="flex items-center gap-4">
          {items.map((it, idx) => (
            <li key={`m-${it}-${idx}`}>
              {it === 'ellipsis' ? (
                <span className="text-foreground/60 px-2">…</span>
              ) : (
                <Link
                  href={buildHref(it)}
                  aria-current={it === page ? 'page' : undefined}
                  className={
                    it === page
                      ? 'flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 !text-white transition-colors duration-200'
                      : 'text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]'
                  }
                >
                  {it}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-label="Следующая страница"
          className="text-primary transition-colors duration-200 hover:text-purple-700"
        >
          →
        </Link>
      </div>
    </nav>
  );
}
