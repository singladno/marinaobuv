'use client';

interface OrdersEmptyStateProps {
  isSearchResult?: boolean;
}

export function OrdersEmptyState({ isSearchResult = false }: OrdersEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {isSearchResult ? 'Заказы не найдены' : 'Нет заказов'}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isSearchResult
            ? 'Попробуйте изменить параметры поиска'
            : 'Заказы появятся здесь после оформления клиентами'}
        </p>
      </div>
    </div>
  );
}
