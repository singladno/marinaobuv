'use client';

import Link from 'next/link';

interface GruzchikPortalMenuItemsProps {
  isOnGruzchik: boolean;
  onClose: () => void;
  className?: string;
}

export function GruzchikPortalMenuItems({
  isOnGruzchik,
  onClose,
  className = '',
}: GruzchikPortalMenuItemsProps) {
  if (isOnGruzchik) {
    // Show only Customer portal when currently on gruzchik
    return (
      <Link
        href="/"
        onClick={onClose}
        className={`group flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-gray-700 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-50 sm:px-4 sm:py-3 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${className}`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 sm:h-10 sm:w-10 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
          <svg
            className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold sm:text-base">
            Клиентский портал
          </div>
          <div className="text-xs opacity-80 sm:text-sm">Просмотр товаров</div>
        </div>
      </Link>
    );
  }

  // Show only Gruzchik portal when currently in customer area
  return (
    <Link
      href="/gruzchik"
      onClick={onClose}
      className={`group flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-gray-700 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-orange-50 sm:px-4 sm:py-3 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${className}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 sm:h-10 sm:w-10 dark:bg-orange-900/30 dark:group-hover:bg-orange-900/50">
        <svg
          className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5 dark:text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <div className="text-left">
        <div className="text-sm font-semibold sm:text-base">Грузчик панель</div>
        <div className="text-xs opacity-80 sm:text-sm">Управление заказами</div>
      </div>
    </Link>
  );
}
