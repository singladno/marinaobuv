'use client';

import React, { useState, useEffect } from 'react';

import { EditableInput } from './EditableInput';
import { EditableSelect } from './EditableSelect';

interface EditableProductCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  isSaving: boolean;
  type?: 'text' | 'number' | 'select';
  step?: string;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  status?: 'idle' | 'saving' | 'success' | 'error';
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
  status,
}: EditableProductCellProps) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = (nextValue?: string) => {
    const finalValue = nextValue ?? editValue;
    if (finalValue !== value) {
      onSave(finalValue);
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
        className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} w-full ${className}`}
        onClick={disabled ? undefined : onEdit}
        data-editable="true"
      >
        {value || '-'}
      </div>
    );
  }

  // Keep width stable while editing and let UI components control visual style
  const inputClassName = `w-full min-w-0 text-sm ${className}`;

  if (type === 'select') {
    return (
      <EditableSelect
        value={editValue}
        onChange={setEditValue}
        onSave={handleSave}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        disabled={disabled}
        isSaving={isSaving || status === 'saving'}
        options={options}
        status={status}
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
