import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import { Tabs, Tab } from '@/components/ui/Tabs';
import { useApprovalEventsConnection } from '@/hooks/useApprovalEventsConnection';
import { useDraftsTable } from '@/hooks/useDraftsTable';
import type { Draft } from '@/types/admin';
import { createColumnConfigs } from '@/utils/columnConfigs';

import { ColumnSettingsModal } from './ColumnSettingsModal';
import { DraftTableActions } from './DraftTableActions';
import { DraftTableContent } from './DraftTableContent';

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
  isRunningAI = false,
  currentProcessingDraft,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  status?: string;
  onStatusChange?: (status: string | undefined) => void;
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
  isRunningAI?: boolean;
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const draftIds = React.useMemo(() => data.map(draft => draft.id), [data]);
  const { isConnected, rowEvents, setRowEvents } =
    useApprovalEventsConnection(draftIds);

  const {
    table,
    columnVisibility,
    handleToggleColumn,
    handleResetColumns,
    savingStatus,
    applyLocalPatch,
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

  const columnConfigs = createColumnConfigs(columnVisibility, status);
  const hasData = !loading && !error && table.getRowModel().rows.length > 0;

  React.useEffect(() => {
    if (!isConnected || rowEvents.length === 0) return;
    // Apply incoming patches to visible rows via optimistic handler
    rowEvents.forEach(evt => {
      if (!draftIds.includes(evt.id)) return;
      applyLocalPatch(evt.id, evt.patch);
    });
    // Clear queue
    setRowEvents([]);
  }, [isConnected, rowEvents, draftIds, setRowEvents, table, applyLocalPatch]);

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <Tabs
          value={status ?? 'draft'}
          onChange={value => onStatusChange?.(value)}
        >
          <Tab value="draft">Черновики</Tab>
          <Tab value="approved">Обработано</Tab>
          <Tab value="deleted">Удаленные</Tab>
        </Tabs>
      </div>

      <DraftTableActions
        status={status}
        selectedCount={selectedCount}
        onApprove={onApprove}
        onConvertToCatalog={onConvertToCatalog}
        onBulkDelete={onBulkDelete}
        onBulkRestore={onBulkRestore}
        onBulkPermanentDelete={onBulkPermanentDelete}
        onReload={onReload}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showBottomBorder={hasData}
        savingStatus={savingStatus}
        isRunningAI={isRunningAI}
        currentProcessingDraft={currentProcessingDraft}
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

      <ColumnSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        columns={columnConfigs}
        onToggleColumn={handleToggleColumn}
        onReset={handleResetColumns}
      />
    </div>
  );
}
