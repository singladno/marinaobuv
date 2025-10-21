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
    status,
  } = useEditableCell({ value: value || '', onSave });

  const getStatusIndicator = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        );
      case 'success':
        return (
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
            <svg
              className="h-2 w-2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
            <svg
              className="h-2 w-2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isEditing) {
    const current = options.find(o => o.value === (value || ''));
    return (
      <div className="relative">
        <div
          className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${className} ${
            isSaving
              ? 'border-violet-300 bg-violet-50 text-gray-500 dark:border-violet-600 dark:bg-violet-900/20 dark:text-gray-400'
              : 'border-gray-300 bg-transparent focus:border-blue-500 dark:border-gray-600 dark:text-white'
          }`}
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
        {status !== 'idle' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {getStatusIndicator()}
          </div>
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
