import * as React from 'react';

import { TableLoader } from '@/components/ui/Loader';
import type { Draft } from '@/types/admin';

import { DraftEmptyState } from './DraftEmptyState';
import { DraftErrorState } from './DraftErrorState';
import { DraftTableBody } from './DraftTableBody';
import { DraftTableHeader } from './DraftTableHeader';

interface DraftTableContentProps {
  table: any; // Table from react-table
  loading?: boolean;
  error?: string | null;
  status?: string;
  hasData: boolean;
}

export function DraftTableContent({
  table,
  loading,
  error,
  status,
  hasData,
}: DraftTableContentProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
        <TableLoader message="Загрузка данных..." />
      </div>
    );
  }

  if (error) {
    return <DraftErrorState error={error} />;
  }

  if (!hasData) {
    return <DraftEmptyState status={status} />;
  }

  return (
    <div className="h-full overflow-auto">
      <table className="h-full w-full min-w-[1200px] border-separate border-spacing-0">
        <DraftTableHeader table={table} />
        <DraftTableBody table={table} />
      </table>
    </div>
  );
}
