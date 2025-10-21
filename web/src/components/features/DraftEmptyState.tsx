import * as React from 'react';

interface DraftEmptyStateProps {
  status?: string;
}

export function DraftEmptyState({ status }: DraftEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
          <svg
            className="h-6 w-6 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          {status === 'approved' ? 'Нет одобренных товаров' : 'Нет черновиков'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {status === 'approved'
            ? 'Одобренные товары появятся здесь после утверждения черновиков'
            : 'Черновики товаров появятся здесь после обработки сообщений'}
        </p>
      </div>
    </div>
  );
}
