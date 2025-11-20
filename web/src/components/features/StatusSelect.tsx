import React, { useState, useEffect, useRef, startTransition } from 'react';

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
  // Internal state to show optimistic updates immediately
  const [displayValue, setDisplayValue] = useState(value);
  const [localStatus, setLocalStatus] = useState<
    'idle' | 'saving' | 'success' | 'error' | null
  >(null);
  const isUpdatingRef = useRef(false);

  // Sync with prop value (for external updates) - but don't overwrite if we just updated
  useEffect(() => {
    // Only sync if we didn't just update it ourselves
    if (!isUpdatingRef.current) {
      setDisplayValue(value);
    }
  }, [value]);

  // Determine the actual status to display
  // Use localStatus if set (for immediate feedback), otherwise use parent's status
  const actualStatus = localStatus ?? status;

  const handleValueChange = (val: string) => {
    // Mark that we're updating to prevent useEffect from overwriting
    isUpdatingRef.current = true;

    // Update display value immediately for instant feedback (fast, non-blocking)
    setDisplayValue(val);

    // Set local status to 'saving' immediately for instant loader feedback
    setLocalStatus('saving');

    // Reset the flag after updates
    requestAnimationFrame(() => {
      isUpdatingRef.current = false;
    });

    // Defer parent callback to allow dropdown to close first
    setTimeout(() => {
      onChange(val);
    }, 0);
  };

  // Clear local status when parent's status becomes 'idle' (save complete)
  useEffect(() => {
    if (status === 'idle' && localStatus === 'saving') {
      setLocalStatus(null);
    }
  }, [status, localStatus]);

  return (
    <Select
      value={displayValue}
      onValueChange={handleValueChange}
      className="w-full"
      disabled={disabled}
    >
      <SelectTrigger
        className={`${actualStatus === 'saving' ? 'pr-10' : 'pr-8'} ${className}`}
        aria-label={ariaLabel}
      >
        <div className="flex w-full min-w-0 items-center justify-between">
          <span className="block min-w-0 flex-1 truncate">
            {(() => {
              // Find the label for the current displayValue - use Map for O(1) lookup
              const option = options.find(opt => opt.value === displayValue);
              return option ? option.label : displayValue || placeholder;
            })()}
          </span>
          <span className="ml-2 flex shrink-0 items-center">
            {actualStatus === 'saving' && (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent bg-white dark:bg-gray-800"
                style={{
                  minWidth: '16px',
                  minHeight: '16px',
                }}
                role="status"
                aria-live="polite"
                aria-label="Сохранение..."
              />
            )}
            {status === 'success' && (
              <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                <svg
                  className="h-2 w-2 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
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
