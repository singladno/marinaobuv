export function ResultsHeaderSkeleton() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
      <div className="hidden lg:block">
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  );
}
