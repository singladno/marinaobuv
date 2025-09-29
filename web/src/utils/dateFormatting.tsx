import React from 'react';

export function formatTimestamp(timestamp: number | null): React.ReactNode {
  if (!timestamp) return 'Неизвестно';
  const date = new Date(timestamp * 1000);
  return (
    <div className="text-sm">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {date.toLocaleDateString('ru-RU')}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {date.toLocaleTimeString('ru-RU')}
      </div>
    </div>
  );
}

export function formatCreatedAt(createdAt: string): React.ReactNode {
  const date = new Date(createdAt);
  return (
    <div className="text-sm">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {date.toLocaleDateString('ru-RU')}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {date.toLocaleTimeString('ru-RU')}
      </div>
    </div>
  );
}
