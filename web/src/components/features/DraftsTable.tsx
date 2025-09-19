import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import { Tabs, Tab } from '@/components/ui/Tabs';
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
  selectedCount,
  loading = false,
  error,
  categories,
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
  selectedCount?: number;
  loading?: boolean;
  error?: string | null;
  categories: CategoryNode[];
}) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleDelete = React.useCallback(async (id: string) => {
    await fetch('/api/admin/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        data: { isDeleted: true },
      }),
    });
  }, []);

  const {
    table,
    columnVisibility,
    handleToggleColumn,
    handleResetColumns,
    savingStatus,
    handleSelectAll,
    allSelected,
    someSelected,
  } = useDraftsTable({
    data,
    selected,
    onToggle,
    onSelectAll,
    onPatch,
    onDelete: handleDelete,
    categories,
    onReload,
  });

  const columnConfigs = createColumnConfigs(columnVisibility);
  const hasData = !loading && !error && table.getRowModel().rows.length > 0;

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      {/* Tabs - Always visible at top */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <Tabs
          value={status ?? 'draft'}
          onChange={value => onStatusChange?.(value)}
        >
          <Tab value="draft">Черновики</Tab>
          <Tab value="approved">Одобрено</Tab>
        </Tabs>
      </div>

      {/* Header with title and action buttons */}
      <DraftTableActions
        status={status}
        selectedCount={selectedCount}
        onApprove={onApprove}
        onConvertToCatalog={onConvertToCatalog}
        onBulkDelete={onBulkDelete}
        onReload={onReload}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showBottomBorder={hasData}
        savingStatus={savingStatus}
      />

      {/* Table content - This should be the scrollable area */}
      <div className="min-h-0 flex-1">
        <DraftTableContent
          table={table}
          loading={loading}
          error={error}
          status={status}
          hasData={hasData}
          savingStatus={savingStatus}
          onToggle={onToggle}
        />
      </div>

      {/* Column Settings Modal */}
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
