import React from 'react';

interface EditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className: string;
  disabled: boolean;
  isSaving: boolean;
  options: Array<{ value: string; label: string }>;
}

export function EditableSelect({
  value,
  onChange,
  onSave,
  onKeyDown,
  className,
  disabled,
  isSaving,
  options,
}: EditableSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={onKeyDown}
      className={className}
      autoFocus
      disabled={disabled || isSaving}
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
