'use client';

import React, { useState, useEffect } from 'react';

interface EditableProductCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  isSaving: boolean;
  type?: 'text' | 'number' | 'select';
  step?: string;
  className?: string;
  options?: Array<{ value: string; label: string }>;
}

export function EditableProductCell({
  value,
  onSave,
  isEditing,
  onEdit,
  isSaving,
  type = 'text',
  step,
  className = '',
  options = [],
}: EditableProductCellProps) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`cursor-pointer ${className}`}
        onClick={onEdit}
        data-editable="true"
      >
        {value || '-'}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <select
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`}
        autoFocus
        aria-label="Выберите значение"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      step={step}
      className={`w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`}
      autoFocus
      disabled={isSaving}
      aria-label="Редактировать значение"
    />
  );
}
