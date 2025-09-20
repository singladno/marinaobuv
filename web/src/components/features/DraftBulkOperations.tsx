'use client';

import * as React from 'react';
import type { Draft } from '@/types/admin';

interface DraftBulkOperationsProps {
  selectedIds: string[];
  status?: string;
  onApprove: () => Promise<void>;
  onConvertToCatalog: () => Promise<void>;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkPermanentDelete: () => void;
  onRunAIScript: () => Promise<void>;
  isRunningAI: boolean;
  isProcessing: boolean;
  currentProcessingDraft?: string | null;
}

export function DraftBulkOperations({
  selectedIds,
  status,
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onRunAIScript,
  isRunningAI,
  isProcessing,
  currentProcessingDraft,
}: DraftBulkOperationsProps) {
  const selectedCount = selectedIds.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Выбрано: {selectedCount}
      </span>

      {/* Черновики - одобрить, удалить */}
      {status === 'draft' && (
        <>
          <button
            onClick={onApprove}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            Одобрить
          </button>

          <button
            onClick={onBulkDelete}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            Удалить
          </button>
        </>
      )}

      {/* Одобрено - Запустить AI, добавить в каталог, удалить */}
      {status === 'approved' && (
        <>
          <button
            onClick={onRunAIScript}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isRunningAI ? 'Запуск AI...' : 'Запустить AI'}
          </button>

          <button
            onClick={onConvertToCatalog}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            В каталог
          </button>

          <button
            onClick={onBulkDelete}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            Удалить
          </button>
        </>
      )}

      {/* Удаленные - восстановить, удалить навсегда */}
      {status === 'deleted' && (
        <>
          <button
            onClick={onBulkRestore}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            Восстановить
          </button>

          <button
            onClick={onBulkPermanentDelete}
            disabled={isRunningAI || isProcessing}
            className="rounded bg-red-800 px-3 py-1 text-sm text-white hover:bg-red-900 disabled:opacity-50"
          >
            Удалить навсегда
          </button>
        </>
      )}

      {isProcessing && currentProcessingDraft && (
        <span className="text-xs text-gray-500">
          Обрабатывается: {currentProcessingDraft}
        </span>
      )}
    </div>
  );
}
