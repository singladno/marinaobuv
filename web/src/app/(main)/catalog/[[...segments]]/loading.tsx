export default function LoadingCatalog() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div className="md:col-span-3 space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="md:col-span-9">
        <div className="mb-4 h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
