'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { buildQueryString } from '@/lib/filters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { getPaginationPages } from '@/utils/getPaginationPages';

type CatalogPaginationProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  filters?: any;
  categoryId?: string;
  pageSizeOptions?: number[];
};
 
export default function CatalogPagination({
  basePath,
  page,
  pageSize,
  total,
  filters,
  categoryId,
  pageSizeOptions = [20, 40, 60],
}: CatalogPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = useMemo(() => getPaginationPages(page, totalPages), [page, totalPages]);
  const router = useRouter();

  const buildHref = (n: number) => {
    const queryParams: { page: number; pageSize: number; categoryId?: string } = {
      page: n,
      pageSize,
    };
    if (categoryId) queryParams.categoryId = categoryId;
    return `${basePath}${buildQueryString(queryParams, filters ? { ...filters, categoryId } : undefined)}`;
  };

  return (
    <nav className="mt-8 w-full">
      <div className="flex items-center gap-3">
        {totalPages > 1 && (
          <Link href={buildHref(Math.max(1, page - 1))} aria-label="Предыдущая страница" className="text-primary rounded px-2 py-1 text-sm transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]">←</Link>
        )}

        {totalPages > 1 && (
          <ul className="flex items-center gap-2">
            {items.map((it, idx) => (
              <li key={`${it}-${idx}`}>
                {it === 'ellipsis' ? (
                  <span className="text-foreground/60 px-1">…</span>
                ) : (
                  <Link href={buildHref(it)} aria-current={it === page ? 'page' : undefined} className={it === page ? 'flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 !text-white text-sm' : 'text-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]'}>
                    {it}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <Link href={buildHref(Math.min(totalPages, page + 1))} aria-label="Следующая страница" className="text-primary rounded px-2 py-1 text-sm transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]">→</Link>
        )}

        <div className="ml-3 h-5 w-px bg-[color-mix(in_oklab,var(--color-foreground),transparent_85%)]" />

        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <span>На странице</span>
          <Select
            value={String(pageSize)}
            placement="auto"
            onValueChange={(val) => {
              const nextSize = Number(val);
              const queryParams = { page: 1, pageSize: nextSize, categoryId } as {
                page: number;
                pageSize: number;
                categoryId?: string;
              };
              const href = `${basePath}${buildQueryString(queryParams, filters ? { ...filters, categoryId } : undefined)}`;
              router.push(href);
            }}
            className="w-[84px]"
          >
            <SelectTrigger className="h-8 rounded-md px-2 text-sm" aria-label="Выбрать размер страницы">
              <SelectValue>{String(pageSize)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </nav>
  );
}
