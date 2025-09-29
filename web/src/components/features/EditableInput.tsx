import React from 'react';

interface EditableInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  type: 'text' | 'number';
  step?: string;
  className: string;
  disabled: boolean;
  isSaving: boolean;
}

export function EditableInput({
  value,
  onChange,
  onSave,
  onKeyDown,
  type,
  step,
  className,
  disabled,
  isSaving,
}: EditableInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={onKeyDown}
      step={step}
      className={className}
      autoFocus
      disabled={disabled || isSaving}
      aria-label="Редактировать значение"
    />
  );
}
