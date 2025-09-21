import React from 'react';
import {
  ApprovalEventsProvider,
  useApprovalEvents,
} from '@/contexts/ApprovalEventsContext';
import { useDraftsTableNew } from '@/hooks/useDraftsTableNew';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

interface DraftTableWithApprovalStateProps {
  data: Draft[];
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: string;
}

function DraftTableContent({
  data,
  onPatch,
  onDelete,
  onImageToggle,
  categories,
  onReload,
  status,
}: DraftTableWithApprovalStateProps) {
  const { getApprovalState, updateDraftIds } = useApprovalEvents();

  // Update draft IDs when data changes
  React.useEffect(() => {
    const draftIds = data.map(draft => draft.id);
    updateDraftIds(draftIds);
  }, [data, updateDraftIds]);

  return useDraftsTableNew({
    data,
    onPatch,
    onDelete,
    onImageToggle,
    categories,
    onReload,
    status,
    getApprovalState,
  });
}

export function DraftTableWithApprovalState(
  props: DraftTableWithApprovalStateProps
) {
  return <DraftTableContent {...props} />;
}
