import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import { useDraftsTable } from '@/hooks/useDraftsTable';
import type { Draft } from '@/types/admin';

import { DraftTableContent } from './DraftTableContent';
import { DraftTableHeader } from './DraftTableHeader';

export function DraftsTable({
  data,
  selected,
  onToggle,
  onSelectAll,
  onPatch,
  status,
  onStatusChange,
  onReload,
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  selectedCount,
  loading = false,
  error,
  categories,
  currentProcessingDraft,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  status?: 'pending' | 'approved' | 'rejected' | 'deleted' | string;
  onStatusChange?: (status: string) => void;
  onReload?: () => void;
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
  onBulkPermanentDelete?: () => void;
  selectedCount?: number;
  loading?: boolean;
  error?: string | null;
  categories: CategoryNode[];
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // const draftIds = React.useMemo(() => data.map(draft => draft.id), [data]);

  const {
    table,
    savingStatus,
    // applyLocalPatch,
  } = useDraftsTable({
    data,
    selected,
    onToggle,
    onSelectAll,
    onPatch,
    onDelete: async (id: string) => {
      await fetch('/api/admin/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data: { isDeleted: true } }),
      });
    },
    categories,
    onReload,
    status,
  });

  const hasData = !loading && !error && table.getRowModel().rows.length > 0;

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      <DraftTableHeader
        status={status ?? 'pending'}
        onStatusChange={onStatusChange as any}
        selectedCount={selectedCount ?? 0}
        onSelectAll={onSelectAll ? () => onSelectAll(true) : () => {}}
        onBulkDelete={onBulkDelete ?? (() => {})}
        onBulkRestore={onBulkRestore ?? (() => {})}
        onBulkPermanentDelete={onBulkPermanentDelete ?? (() => {})}
        onApprove={onApprove ?? (() => {})}
        onConvertToCatalog={onConvertToCatalog ?? (() => {})}
        loading={loading}
        error={error ?? null}
        categories={categories}
        onReload={onReload ?? (() => {})}
        onColumnSettings={() => setIsSettingsOpen(true)}
        showColumnSettings={isSettingsOpen}
        onCloseColumnSettings={() => setIsSettingsOpen(false)}
      />

      <div className="min-h-0 flex-1">
        <DraftTableContent
          table={table}
          loading={loading}
          error={error}
          status={status}
          hasData={hasData}
          savingStatus={savingStatus}
          onToggle={onToggle}
          currentProcessingDraft={currentProcessingDraft}
        />
      </div>
    </div>
  );
}
