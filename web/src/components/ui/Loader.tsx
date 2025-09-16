import * as React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ size = 'md', className = '' }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400`}
      />
    </div>
  );
}

interface TableLoaderProps {
  message?: string;
  className?: string;
}

export function TableLoader({
  message = 'Загрузка данных...',
  className = '',
}: TableLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <Loader size="lg" className="mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
