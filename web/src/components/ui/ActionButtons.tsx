'use client';

import React from 'react';

import { baseClasses, sizeClasses, variantClasses } from './ButtonStyles';
import type {
  BaseButtonProps,
  ActionButtonGroupProps,
  BulkActionButtonProps,
  RefreshButtonProps,
} from './ButtonTypes';

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

export function ActionButtonGroup({
  children,
  className = '',
}: ActionButtonGroupProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>{children}</div>
  );
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
