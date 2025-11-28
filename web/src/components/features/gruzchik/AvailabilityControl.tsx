'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityControlProps {
  isAvailable: boolean | null;
  onAvailabilityChange: (
    isAvailable: boolean | null,
    clickedButton?: boolean
  ) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingTrue?: boolean;
  loadingFalse?: boolean;
  loadingUnset?: boolean;
  loadingUnsetFromTrue?: boolean;
  loadingUnsetFromFalse?: boolean;
  className?: string;
}

export function AvailabilityControl({
  isAvailable,
  onAvailabilityChange,
  disabled = false,
  loading = false,
  loadingTrue = false,
  loadingFalse = false,
  loadingUnset = false,
  loadingUnsetFromTrue = false,
  loadingUnsetFromFalse = false,
  className,
}: AvailabilityControlProps) {
  const handleAvailabilityClick = (value: boolean) => {
    if (disabled || loading) return;

    // If clicking the same value, unset it (make it null)
    if (isAvailable === value) {
      onAvailabilityChange(null, value);
    } else {
      onAvailabilityChange(value);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-medium text-gray-700">Есть в наличии</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAvailabilityClick(true)}
          disabled={disabled || loadingTrue || loadingUnsetFromTrue}
          className={cn(
            'flex-1 rounded-lg border-2 px-4 py-3 text-center font-medium transition-colors cursor-pointer',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isAvailable === true
              ? 'border-green-400 bg-green-400 text-white hover:bg-green-500'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            {(loadingTrue || loadingUnsetFromTrue) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>Да</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleAvailabilityClick(false)}
          disabled={disabled || loadingFalse || loadingUnsetFromFalse}
          className={cn(
            'flex-1 rounded-lg border-2 px-4 py-3 text-center font-medium transition-colors cursor-pointer',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isAvailable === false
              ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            {(loadingFalse || loadingUnsetFromFalse) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>Нет</span>
          </div>
        </button>
      </div>
    </div>
  );
}
