import React from 'react';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';

interface Option {
  value: string;
  label: string;
}

interface StatusSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  status?: 'idle' | 'saving' | 'success' | 'error';
  className?: string;
  placeholder?: string;
  'aria-label'?: string;
}

export function StatusSelect({
  value,
  options,
  onChange,
  disabled = false,
  status = 'idle',
  className = '',
  placeholder = '-',
  'aria-label': ariaLabel,
}: StatusSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={val => onChange(val)}
      className="w-full"
      disabled={disabled}
    >
      <SelectTrigger className={`pr-8 ${className}`} aria-label={ariaLabel}>
        <div className="flex w-full items-center justify-between">
          <SelectValue placeholder={placeholder}>{value}</SelectValue>
          <span className="ml-2">
            {status === 'saving' && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
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
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default StatusSelect;
