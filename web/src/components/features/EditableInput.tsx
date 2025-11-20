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
    <div className="relative w-full">
      <Input
        type={type}
        value={value}
        onChange={e => onChange((e.target as HTMLInputElement).value)}
        onBlur={(e) => {
          // CRITICAL: Use requestAnimationFrame to defer onSave AFTER blur completes
          // This ensures the input loses focus immediately and browser processes blur first
          const target = e.currentTarget;
          requestAnimationFrame(() => {
            // Only save if still blurred (not refocused)
            if (document.activeElement !== target) {
              onSave();
            }
          });
        }}
        onKeyDown={onKeyDown}
        step={step}
        className={`${className} ${isSaving ? 'pr-10' : ''}`}
        disabled={disabled}
        aria-label="Редактировать значение"
        fullWidth
      />
      {isSaving && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-50 bg-white dark:bg-gray-900 p-1 rounded-full flex items-center justify-center"
          aria-label="Сохранение..."
        >
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
            role="status"
            aria-live="polite"
            style={{
              minWidth: '16px',
              minHeight: '16px',
            }}
          />
        </div>
      )}
    </div>
  );
}
