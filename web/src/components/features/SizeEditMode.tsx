import * as React from 'react';

interface SizeEditModeProps {
  draftSize: string;
  setDraftSize: (size: string) => void;
  draftPairs: number;
  setDraftPairs: (pairs: number) => void;
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
    <div className="flex-shrink-0 rounded border border-blue-300 bg-blue-50 p-1 dark:bg-blue-900/30">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={draftSize}
          onChange={e => setDraftSize(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-12 rounded border border-gray-300 px-1 py-0.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Размер"
          disabled={isSaving}
        />
        <span className="text-gray-500">×</span>
        <input
          type="number"
          value={draftPairs}
          onChange={e => setDraftPairs(Number(e.target.value))}
          onKeyDown={onKeyDown}
          className="w-16 rounded border border-gray-300 px-1 py-0.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Пары"
          disabled={isSaving}
        />
        <button
          onClick={onApply}
          disabled={isSaving}
          className="rounded bg-green-100 px-1 py-0.5 text-xs text-green-800 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
          type="button"
          title="Применить"
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-800 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          type="button"
          title="Отмена"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
