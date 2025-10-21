import * as React from 'react';

interface DraftErrorStateProps {
  error: string;
}

export function DraftErrorState({ error }: DraftErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    </div>
  );
}
