'use client';

import React, { useState, useEffect } from 'react';

import { EditableInput } from './EditableInput';
import { EditableSelect } from './EditableSelect';

interface EditableProductCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancel?: () => void;
  isSaving: boolean;
  type?: 'text' | 'number' | 'select';
  step?: string;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export function EditableProductCell({
  value,
  onSave,
  isEditing,
  onEdit,
  onCancel,
  isSaving,
  type = 'text',
  step,
  className = '',
  options = [],
  disabled = false,
}: EditableProductCellProps) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      if (onCancel) {
        onCancel();
      }
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
        onClick={disabled ? undefined : onEdit}
        data-editable="true"
      >
        {value || '-'}
      </div>
    );
  }

  const inputClassName = `w-full min-w-[200px] rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`;

  if (type === 'select') {
    return (
      <EditableSelect
        value={editValue}
        onChange={setEditValue}
        onSave={handleSave}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        disabled={disabled}
        isSaving={isSaving}
        options={options}
      />
    );
  }

  return (
    <EditableInput
      value={editValue}
      onChange={setEditValue}
      onSave={handleSave}
      onKeyDown={handleKeyDown}
      type={type}
      step={step}
      className={inputClassName}
      disabled={disabled}
      isSaving={isSaving}
    />
  );
}
