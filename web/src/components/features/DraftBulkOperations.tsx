'use client';

import * as React from 'react';
import type { Draft } from '@/types/admin';
import { Loader } from '@/components/ui/Loader';
import { useApprovalEvents } from '@/contexts/ApprovalEventsContext';

interface DraftBulkOperationsProps {
  selectedIds: string[];
  status?: string;
  onApprove: () => Promise<void>;
  onConvertToCatalog: () => Promise<void>;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkPermanentDelete: () => void;
  onRunAIScript: () => Promise<void>;
  onCancelAI?: () => Promise<void>;
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
  onCancelAI,
  isRunningAI,
  isProcessing,
  currentProcessingDraft,
}: DraftBulkOperationsProps) {
  const selectedCount = selectedIds.length;
  const { isAnyDraftApproving, getApprovingDrafts, getApprovalState } =
    useApprovalEvents();

  // Check if any selected drafts are currently being approved
  const isApproving = isAnyDraftApproving(selectedIds);
  const approvingDrafts = getApprovingDrafts(selectedIds);

  // Get detailed approval state for the first approving draft
  const firstApprovingDraft = approvingDrafts[0];
  const approvalState = firstApprovingDraft
    ? getApprovalState(firstApprovingDraft)
    : null;

  return (
    <div className="flex items-center justify-between bg-blue-50 px-6 py-4 dark:bg-blue-900/20">
      <div className="flex items-center space-x-3">
        {/* Черновики - одобрить, удалить */}
        {status === 'draft' && (
          <>
            <button
              onClick={onApprove}
              disabled={
                selectedCount === 0 ||
                isRunningAI ||
                isProcessing ||
                isApproving
              }
              className="flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Одобрение...
                </>
              ) : (
                'Одобрить'
              )}
            </button>

            <button
              onClick={onBulkDelete}
              disabled={selectedCount === 0 || isRunningAI || isProcessing}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex items-center rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Cancel AI Analysis Button - Only show when AI is running */}
            {isRunningAI && onCancelAI && (
              <button
                onClick={onCancelAI}
                className="flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
              >
                Отменить AI
              </button>
            )}

            <button
              onClick={onConvertToCatalog}
              disabled={selectedCount === 0 || isRunningAI || isProcessing}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              В каталог
            </button>

            <button
              onClick={onBulkDelete}
              disabled={selectedCount === 0 || isRunningAI || isProcessing}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Восстановить
            </button>

            <button
              onClick={onBulkPermanentDelete}
              disabled={selectedCount === 0 || isRunningAI || isProcessing}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Удалить навсегда
            </button>
          </>
        )}
      </div>

      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
        {selectedCount > 0
          ? `Выбрано: ${selectedCount}`
          : 'Выберите товары для действий'}
      </div>

      {/* AI Status - Always visible when processing */}
      {isProcessing && currentProcessingDraft && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-sm text-blue-900 dark:text-blue-100">
              Обрабатывается:{' '}
              {currentProcessingDraft.name || 'AI анализ запущен...'}
            </span>
          </div>
          {onCancelAI && (
            <button
              onClick={onCancelAI}
              className="rounded-lg bg-orange-500 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
            >
              Отменить
            </button>
          )}
        </div>
      )}

      {/* AI Status - Show when running but no specific draft */}
      {isRunningAI && !currentProcessingDraft && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
            <span className="text-sm text-blue-900 dark:text-blue-100">
              AI анализ запущен...
            </span>
          </div>
          {onCancelAI && (
            <button
              onClick={onCancelAI}
              className="rounded-lg bg-orange-500 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
            >
              Отменить
            </button>
          )}
        </div>
      )}

      {/* Approval Status - Show when drafts are being approved */}
      {isApproving && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-sm text-blue-900 dark:text-blue-100">
              Одобрение в процессе... ({approvingDrafts.length} из{' '}
              {selectedCount})
            </span>
          </div>

          {/* Detailed progress for the first approving draft */}
          {approvalState && approvalState.isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {approvalState.totalImages > 0
                  ? approvalState.currentImage > 0
                    ? `Загрузка изображений: ${approvalState.currentImage}/${approvalState.totalImages} (${approvalState.progress}%)`
                    : 'Подготовка к загрузке...'
                  : 'Обработка черновика...'}
              </div>
              {approvalState.totalImages > 0 ? (
                <div className="h-1 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-1 rounded-full bg-green-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, approvalState.progress))}%`,
                    }}
                  />
                </div>
              ) : (
                <div className="h-1 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-1 w-full animate-pulse rounded-full bg-green-500" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
