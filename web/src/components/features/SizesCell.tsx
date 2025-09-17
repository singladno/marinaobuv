import * as React from 'react';

import type { Draft } from '@/types/admin';

interface SizesCellProps {
  sizes: Draft['sizes'];
}

export function SizesCell({ sizes }: SizesCellProps) {
  if (!sizes || sizes.length === 0) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {sizes.map((x, index) => (
        <span
          key={index}
          className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >
          {x.size}:{x.stock ?? x.count ?? 0}
        </span>
      ))}
    </div>
  );
}
