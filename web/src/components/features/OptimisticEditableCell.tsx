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
          formatDisplayValue(value, type, placeholder)
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
    className,
    isSaving,
    ariaLabel,
  });

  if (type === 'number' || type === 'price') {
    return (
      <input
        {...inputProps}
        type="number"
        min={min}
        step={step || (type === 'price' ? '0.01' : '1')}
      />
    );
  }

  return <input {...inputProps} type="text" />;
}
