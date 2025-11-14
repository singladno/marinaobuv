'use client';

import React from 'react';

interface QuantityControlsProps {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onBlur?: () => void;
  ariaLabel?: string;
}

export function QuantityControls({
  value,
  disabled = false,
  onChange,
  onBlur,
  ariaLabel,
}: QuantityControlsProps) {
  const handleIncrement = () => onChange(value + 1);
  const handleDecrement = () => {
    if (value > 0) onChange(value - 1);
  };

  const buttonClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors cursor-pointer hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= 0}
        className={buttonClass}
        aria-label="Уменьшить количество"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        onBlur={onBlur}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-center text-sm font-medium outline-none transition-colors [appearance:textfield] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        min="0"
        aria-label={ariaLabel}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled}
        className={buttonClass}
        aria-label="Увеличить количество"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
