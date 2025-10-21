import * as React from 'react';

import type { Draft } from '@/types/admin';

interface ProviderCellProps {
  provider: Draft['provider'];
}

export function ProviderCell({ provider }: ProviderCellProps) {
  if (!provider) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="min-w-0">
      <div className="truncate">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {provider.name}
        </div>
        {provider.phone && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {provider.phone}
          </div>
        )}
        {provider.place && (
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            📍 {provider.place}
          </div>
        )}
      </div>
    </div>
  );
}
