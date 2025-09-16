import * as React from 'react';

import { Tabs, Tab } from '@/components/ui/Tabs';
import { useDraftsTable } from '@/hooks/useDraftsTable';
import type { Draft } from '@/types/admin';
import { createColumnConfigs } from '@/utils/columnConfigs';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import { ColumnSettingsModal } from './ColumnSettingsModal';
import { DraftTableActions } from './DraftTableActions';
import { DraftTableContent } from './DraftTableContent';

export function DraftsTable({
  data,
  selected,
  onToggle,
  onPatch,
  status,
  onStatusChange,
  onReload,
  onApprove,
  onConvertToCatalog,
  selectedCount,
  loading = false,
  error,
  categories,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  status?: string;
  onStatusChange?: (status: string | undefined) => void;
  onReload?: () => void;
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
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

  const { table, columnVisibility, handleToggleColumn, handleResetColumns } =
    useDraftsTable({
      data,
      selected,
      onToggle,
      onPatch,
      onDelete: handleDelete,
      categories,
    });

  const columnConfigs = createColumnConfigs(columnVisibility);
  const hasData = !loading && !error && table.getRowModel().rows.length > 0;

  return (
    <div className="h-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
      {/* Tabs - Always visible at top */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
        onReload={onReload}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showBottomBorder={hasData}
      />

      <div className="relative h-full overflow-auto">
        <DraftTableContent
          table={table}
          loading={loading}
          error={error}
          status={status}
          hasData={hasData}
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
