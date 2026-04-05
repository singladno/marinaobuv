'use client';

/**
 * Placeholder row matching `TopFiltersBarBackend` (sort, sources, price, color, etc.)
 * until the catalog request has completed.
 */
export function TopFiltersBarSkeleton() {
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-2"
      aria-busy="true"
      aria-label="Загрузка фильтров"
    >
      <div className="h-9 w-[8.5rem] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-36 max-w-[min(100%,22rem)] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-44 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
