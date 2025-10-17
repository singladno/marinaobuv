'use client';

import React from 'react';

import { useEditableCell } from '@/hooks/useEditableCell';

interface Option {
  value: string;
  label: string;
}

interface OptimisticEditableSelectProps {
  value: string | null;
  options: Option[];
  placeholder?: string;
  className?: string;
  onSave: (value: string | number | null) => Promise<void>;
  'aria-label'?: string;
}

export function OptimisticEditableSelect({
  value,
  options,
  placeholder = '—',
  className = '',
  onSave,
  'aria-label': ariaLabel,
}: OptimisticEditableSelectProps) {
  const {
    isEditing,
    editValue,
    isSaving,
    handleEdit,
    handleKeyDown,
    handleBlur,
    setEditValue,
  } = useEditableCell({ value: value || '', onSave });

  if (!isEditing) {
    const current = options.find(o => o.value === (value || ''));
    return (
      <div
        className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        onClick={handleEdit}
        data-editable="true"
        title="Нажмите для редактирования"
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs text-gray-500">Сохранение...</span>
          </div>
        ) : (
          current?.label || placeholder
        )}
      </div>
    );
  }

  return (
    <select
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`}
      autoFocus
      disabled={isSaving}
      aria-label={ariaLabel}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
