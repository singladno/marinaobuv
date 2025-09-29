import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import { Tabs, Tab } from '@/components/ui/Tabs';

import { ColumnSettingsModal } from './ColumnSettingsModal';
import { DraftTableActions } from './DraftTableActions';

interface DraftTableHeaderProps {
  status: string;
  onStatusChange: (status: string) => void;
  selectedCount: number;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkPermanentDelete: () => void;
  onApprove: () => void;
  onConvertToCatalog: () => void;
  loading: boolean;
  error: string | null;
  categories: CategoryNode[];
  onReload: () => void;
  onColumnSettings: () => void;
  showColumnSettings: boolean;
  onCloseColumnSettings: () => void;
}

export function DraftTableHeader({
  status,
  onStatusChange,
  selectedCount,
  onSelectAll,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onApprove,
  onConvertToCatalog,
  loading,
  error,
  categories,
  onReload,
  onColumnSettings,
  showColumnSettings,
  onCloseColumnSettings,
}: DraftTableHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <Tabs value={status} onValueChange={onStatusChange}>
        <Tab value="pending">Ожидают обработки</Tab>
        <Tab value="approved">Одобренные</Tab>
        <Tab value="rejected">Отклоненные</Tab>
        <Tab value="deleted">Удаленные</Tab>
      </Tabs>

      {/* Actions Toolbar */}
      <DraftTableActions
        status={status}
        onReload={onReload}
        onOpenSettings={onColumnSettings}
      />

      {/* Column Settings Modal */}
      {showColumnSettings && (
        <ColumnSettingsModal
          isOpen={showColumnSettings}
          onClose={onCloseColumnSettings}
          columns={[]}
          onToggleColumn={() => {}}
          onReset={() => {}}
        />
      )}
    </div>
  );
}
