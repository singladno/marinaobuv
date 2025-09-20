'use client';

import React from 'react';

interface BaseButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

const baseClasses =
  'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const variantClasses = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
  success:
    'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600',
  warning:
    'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600',
};

export function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  size = 'md',
  variant = 'primary',
}: BaseButtonProps) {
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Загрузка...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionButtonGroup({
  children,
  className = '',
}: ActionButtonGroupProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>{children}</div>
  );
}

interface BulkActionButtonProps {
  children: React.ReactNode;
  count: number;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

export function BulkActionButton({
  children,
  count,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
}: BulkActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || count === 0}
      loading={loading}
      variant={variant}
    >
      {children} ({count})
    </Button>
  );
}

interface RefreshButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function RefreshButton({
  onClick,
  loading = false,
  disabled = false,
}: RefreshButtonProps) {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      variant="secondary"
      size="sm"
    >
      Обновить
    </Button>
  );
}
