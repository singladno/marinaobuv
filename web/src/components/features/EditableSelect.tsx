import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';

interface EditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSave: (value?: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className: string;
  disabled: boolean;
  isSaving: boolean;
  options: Array<{ value: string; label: string }>;
  status?: 'idle' | 'saving' | 'success' | 'error';
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
  status,
}: EditableSelectProps) {
  return (
    <div onKeyDown={onKeyDown} className="relative">
      <Select
        value={value}
        onValueChange={val => {
          onChange(val);
          onSave(val);
        }}
        className="w-full"
        disabled={disabled}
      >
        <SelectTrigger
          className={`pr-8 ${className}`}
          aria-label="Выберите значение"
          // Do not auto focus; and do not save on blur
        >
          <div className="flex w-full items-center justify-between">
            <SelectValue placeholder="-">{value}</SelectValue>
            <span className="ml-2">
              {status === 'saving' && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              )}
              {status === 'success' && (
                <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* status icon is embedded inside trigger to ensure visibility */}
    </div>
  );
}
