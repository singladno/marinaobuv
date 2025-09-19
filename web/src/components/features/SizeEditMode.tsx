import * as React from 'react';

interface SizeEditModeProps {
  draftSize: string;
  setDraftSize: (value: string) => void;
  draftPairs: string;
  setDraftPairs: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onApply: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function SizeEditMode({
  draftSize,
  setDraftSize,
  draftPairs,
  setDraftPairs,
  onKeyDown,
  onApply,
  onCancel,
  isSaving,
}: SizeEditModeProps) {
  return (
    <div className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100">
      <input
        value={draftSize}
        onChange={e => setDraftSize(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isSaving}
        className="h-6 w-16 rounded border border-yellow-300 bg-white px-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:border-yellow-700 dark:bg-gray-800 dark:text-gray-100"
        placeholder="Размер"
        aria-label="Размер"
      />
      <input
        value={draftPairs}
        onChange={e => setDraftPairs(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isSaving}
        className="h-6 w-12 rounded border border-yellow-300 bg-white px-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:border-yellow-700 dark:bg-gray-800 dark:text-gray-100"
        placeholder="Пары"
        aria-label="Пары"
        inputMode="numeric"
      />
      <button
        type="button"
        className="rounded px-1 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/20"
        onClick={onApply}
        disabled={isSaving}
        aria-label="Сохранить"
        title="Сохранить"
      >
        ✓
      </button>
      <button
        type="button"
        className="rounded px-1 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
        onClick={onCancel}
        disabled={isSaving}
        aria-label="Отменить"
        title="Отменить"
      >
        ↩
      </button>
    </div>
  );
}
