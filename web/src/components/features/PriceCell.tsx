import * as React from 'react';

interface PriceCellProps {
  value: number | null | undefined;
  formatter?: (value: number) => string;
}

export function PriceCell({ value, formatter }: PriceCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const displayValue = formatter ? formatter(value) : `₽${value.toLocaleString()}`;

  return (
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {displayValue}
    </span>
  );
}
