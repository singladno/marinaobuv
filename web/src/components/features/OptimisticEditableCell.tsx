'use client';

import React, { useState, useCallback } from 'react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(String(value || ''));
  }, [disabled, value]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const newValue =
      type === 'number' || type === 'price'
        ? editValue === ''
          ? null
          : Number(editValue)
        : editValue;

    // Only save if value actually changed
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
      } catch (error) {
        console.error('Failed to save:', error);
        // Revert to original value on error
        setEditValue(String(value || ''));
      } finally {
        setIsSaving(false);
      }
    }

    setIsEditing(false);
  }, [isSaving, editValue, value, type, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(String(value || ''));
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    if (isEditing) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  const formatDisplayValue = useCallback(
    (val: string | number | null) => {
      if (val === null || val === '') return placeholder || '—';

      if (type === 'price' && typeof val === 'number') {
        return (val / 100).toLocaleString('ru-RU');
      }

      return String(val);
    },
    [type, placeholder]
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
          formatDisplayValue(value)
        )}
      </div>
    );
  }

  const inputProps = {
    value: editValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditValue(e.target.value),
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    placeholder,
    className: `w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`,
    autoFocus: true,
    disabled: isSaving,
    'aria-label': ariaLabel,
  };

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
