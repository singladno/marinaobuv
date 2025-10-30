import React from 'react';
import { Input } from '@/components/ui/Input';

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
    <Input
      type={type}
      value={value}
      onChange={e => onChange((e.target as HTMLInputElement).value)}
      onBlur={() => onSave()}
      onKeyDown={onKeyDown}
      step={step}
      className={className}
      // avoid autoFocus to prevent global focus/blur cascades
      disabled={disabled || isSaving}
      aria-label="Редактировать значение"
      fullWidth
    />
  );
}
