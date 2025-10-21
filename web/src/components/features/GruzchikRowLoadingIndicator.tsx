interface RowLoadingIndicatorProps {
  isUpdating: boolean;
}

export function RowLoadingIndicator({ isUpdating }: RowLoadingIndicatorProps) {
  if (!isUpdating) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
      <div className="flex items-center space-x-2 rounded-full border bg-white px-3 py-1 shadow-lg dark:bg-gray-800">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Обновление...
        </span>
      </div>
    </div>
  );
}
