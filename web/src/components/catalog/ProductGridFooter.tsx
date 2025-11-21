interface ProductGridFooterProps {
  hasNextPage: boolean;
  loadingMore: boolean;
  error: string | null;
  onRetry?: () => void;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
  showEndMessage: boolean;
  totalProducts: number;
}

export function ProductGridFooter({
  hasNextPage,
  loadingMore,
  error,
  onRetry,
  loadMoreRef,
  showEndMessage,
  totalProducts,
}: ProductGridFooterProps) {
  return (
    <>
      {hasNextPage && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {loadingMore ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Загрузка товаров...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-red-600">Ошибка загрузки</p>
              <button
                onClick={onRetry}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
              >
                Попробовать снова
              </button>
            </div>
          ) : null}
        </div>
      )}

      {showEndMessage && !hasNextPage && totalProducts > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Показаны все товары ({totalProducts})
          </p>
        </div>
      )}
    </>
  );
}
