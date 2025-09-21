'use client';

import * as React from 'react';
import type { Draft } from '@/types/admin';
import { Loader } from '@/components/ui/Loader';

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
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
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

  return (
    <div className="flex items-center space-x-2">
      {/* Черновики - одобрить, удалить */}
      {status === 'draft' && (
        <>
          <button
            onClick={onApprove}
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            Одобрить
          </button>

          <button
            onClick={onBulkDelete}
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
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
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
            className="flex items-center rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isRunningAI ? (
              <>
                <Loader size="sm" className="mr-2" />
                Запуск AI...
              </>
            ) : (
              'Запустить AI'
            )}
          </button>

          <button
            onClick={onConvertToCatalog}
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            В каталог
          </button>

          <button
            onClick={onBulkDelete}
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
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
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
            className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            Восстановить
          </button>

          <button
            onClick={onBulkPermanentDelete}
            disabled={selectedCount === 0 || isRunningAI || isProcessing}
            className="rounded bg-red-800 px-3 py-1 text-sm text-white hover:bg-red-900 disabled:opacity-50"
          >
            Удалить навсегда
          </button>
        </>
      )}

      <span className="text-sm text-gray-700 dark:text-gray-300">
        {selectedCount > 0
          ? `Выбрано: ${selectedCount}`
          : 'Выберите товары для действий'}
      </span>

      {/* AI Status - Always visible when processing */}
      {isProcessing && currentProcessingDraft && (
        <div className="ml-4 flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-500">
            Обрабатывается:{' '}
            {currentProcessingDraft.name || 'AI анализ запущен...'}
          </span>
        </div>
      )}

      {/* AI Status - Show when running but no specific draft */}
      {isRunningAI && !currentProcessingDraft && (
        <div className="ml-4 flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
          <span className="text-xs text-gray-500">AI анализ запущен...</span>
        </div>
      )}
    </div>
  );
}
