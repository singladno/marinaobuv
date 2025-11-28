'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';

interface PurchaseToggleProps {
  isPurchased: boolean | null;
  onPurchaseChange: (isPurchased: boolean | null) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function PurchaseToggle({
  isPurchased,
  onPurchaseChange,
  disabled = false,
  loading = false,
  className,
}: PurchaseToggleProps) {
  const handleClick = () => {
    if (disabled || loading) return;

    // Toggle between true and null (no false state)
    if (isPurchased === true) {
      onPurchaseChange(null);
    } else {
      onPurchaseChange(true);
    }
  };

  // Toggle is checked when isPurchased is true
  const isChecked = isPurchased === true;

  return (
    <div className={cn('flex items-center', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          'relative flex w-full items-center justify-between rounded-xl border-2 px-4 py-4 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isChecked
            ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50',
          loading && 'opacity-70'
        )}
      >
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'relative flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-all duration-200',
              isChecked
                ? 'border-purple-600 bg-purple-600'
                : 'border-gray-300 bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-200',
                isChecked ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
            {loading && (
              <div
                className={cn(
                  'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center',
                  isChecked ? 'right-1' : 'left-1'
                )}
                style={{ width: '22px', height: '22px' }}
              >
                <Loader
                  size="sm"
                  className="[&>div]:border-white [&>div]:border-t-purple-600"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span
              className={cn(
                'text-base font-semibold transition-colors',
                isChecked ? 'text-purple-700' : 'text-gray-700'
              )}
            >
              Куплено
            </span>
            <span
              className={cn(
                'text-xs transition-colors',
                isChecked ? 'text-purple-600' : 'text-gray-500'
              )}
            >
              {isChecked ? 'Товар закуплен' : 'Отметить как закупленный'}
            </span>
          </div>
        </div>
        {isChecked && !loading && (
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600">
              <Check className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
