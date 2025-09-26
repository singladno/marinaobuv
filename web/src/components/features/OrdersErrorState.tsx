'use client';

interface OrdersErrorStateProps {
  error: string;
}

export function OrdersErrorState({ error }: OrdersErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-red-400">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          Ошибка загрузки
        </h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    </div>
  );
}
