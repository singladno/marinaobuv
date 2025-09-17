import * as React from 'react';

interface BadgeCellProps {
  value: string | null | undefined;
  getLabel: (value: string) => string;
  bgColor: string;
  textColor: string;
}

export function BadgeCell({
  value,
  getLabel,
  bgColor,
  textColor,
}: BadgeCellProps) {
  if (!value) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="text-center">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}
      >
        {getLabel(value)}
      </span>
    </div>
  );
}
