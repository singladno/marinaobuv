import React from 'react';
import { AIIndicator } from '@/components/ui/AIIndicator';
import { useAIStatus } from '@/hooks/useAIStatus';

interface AISelectionCellWithEventsProps {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

export const AISelectionCellWithEvents = React.memo(
  ({ id, selected, onToggle }: AISelectionCellWithEventsProps) => {
    const { data: aiStatusData } = useAIStatus('approved');

    // Find the current draft in AI status data
    const currentDraft = aiStatusData?.drafts.find(draft => draft.id === id);
    const isProcessing = currentDraft?.aiStatus === 'ai_processing';

    // If the draft is being processed by AI, show the AI indicator
    if (isProcessing) {
      return (
        <div className="flex h-full items-center justify-center">
          <AIIndicator status="processing" className="h-8 w-8" />
        </div>
      );
    }

    // Otherwise, show the normal checkbox
    return (
      <div className="flex h-full items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Select draft ${id}`}
        />
      </div>
    );
  }
);

AISelectionCellWithEvents.displayName = 'AISelectionCellWithEvents';
