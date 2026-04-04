'use client';

import React from 'react';

import { useEditableCell } from '@/hooks/useEditableCell';
import { formatDisplayValue, getInputProps } from '@/utils/editableCellUtils';

interface OptimisticEditableCellProps {
  value: string | number | null;
  onSave: (value: string | number | null) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'number' | 'price';
  min?: number;
  step?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function OptimisticEditableCell({
  value,
  onSave,
  placeholder = '',
  type = 'text',
  min,
  step,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}: OptimisticEditableCellProps) {
  const {
    isEditing,
    editValue,
    isSaving,
    status,
    handleEdit,
    handleKeyDown,
    handleBlur,
    setEditValue,
  } = useEditableCell({
    value,
    onSave,
    type,
    disabled,
  });

  const successIcon = (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500"
      aria-hidden
    >
      <svg
        className="h-2.5 w-2.5 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );

  if (!isEditing) {
    return (
      <div
        className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        } ${className}`}
        onClick={handleEdit}
        data-editable="true"
        title={
          disabled ? 'Редактирование отключено' : 'Нажмите для редактирования'
        }
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs text-gray-500">Сохранение...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{formatDisplayValue(value, type, placeholder)}</span>
            {status === 'success' && successIcon}
          </div>
        )}
      </div>
    );
  }

  const inputProps = getInputProps({
    editValue,
    setEditValue,
    handleBlur,
    handleKeyDown,
    placeholder,
    className: `${className} ${isSaving ? 'pr-10' : ''}`,
    isSaving,
    ariaLabel,
  });

  if (type === 'number' || type === 'price') {
    return (
      <div className="relative w-full min-w-0">
        <input
          {...inputProps}
          type="number"
          min={min}
          step={step || (type === 'price' ? '0.01' : '1')}
        />
        {isSaving && (
          <div
            className="pointer-events-none absolute right-3 top-1/2 z-50 flex -translate-y-1/2 items-center justify-center rounded-full bg-white p-1 dark:bg-gray-900"
            aria-label="Сохранение..."
          >
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
              role="status"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full min-w-0">
      <input {...inputProps} type="text" />
      {isSaving && (
        <div
          className="pointer-events-none absolute right-3 top-1/2 z-50 flex -translate-y-1/2 items-center justify-center rounded-full bg-white p-1 dark:bg-gray-900"
          aria-label="Сохранение..."
        >
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
            role="status"
          />
        </div>
      )}
    </div>
  );
}
