export function ProductCardSkeleton() {
  return (
    <div className="bg-surface rounded-card-large shadow-card flex h-full flex-col overflow-hidden">
      <div className="bg-muted group/image relative aspect-square w-full overflow-hidden">
        <div className="h-full w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>
      <div className="space-y-3 p-5">
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="relative z-30 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
