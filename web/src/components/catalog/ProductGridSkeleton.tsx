interface ProductGridSkeletonProps {
  gridCols: 4 | 5;
  count?: number;
}

export function ProductGridSkeleton({
  gridCols,
  count = 8,
}: ProductGridSkeletonProps) {
  const gridClasses = {
    4: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div className={gridClasses[gridCols]}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          <div className="mt-4 space-y-2">
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
