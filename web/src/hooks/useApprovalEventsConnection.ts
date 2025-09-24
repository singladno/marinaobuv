import { useEffect, useRef, useState } from 'react';
import type {
  ApprovalEvent,
  ApprovalState,
} from '@/contexts/ApprovalEventsContext';

export function useApprovalEventsConnection(draftIds: string[]) {
  const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [rowEvents, setRowEvents] = useState<Array<{ id: string; patch: any }>>(
    []
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const draftIdsRef = useRef<string[]>([]);

  // Update the ref when draftIds change
  useEffect(() => {
    draftIdsRef.current = draftIds;
  }, [draftIds]);

  useEffect(() => {
    if (!draftIds || draftIds.length === 0) return;

    console.log(
      `🔌 Creating single SSE connection for ${draftIds.length} drafts:`,
      draftIds
    );

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create a single EventSource for all drafts
    const eventSource = new EventSource('/api/approval-events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`🔌 Connected to approval events for all drafts`);
      setIsConnected(true);
    };

    eventSource.onmessage = event => {
      try {
        const data: ApprovalEvent = JSON.parse(event.data);
        console.log('📡 Received approval event:', data);

        // Handle ping events
        if (data.type === 'ping') {
          return;
        }

        // Only process events for drafts we're interested in
        if (!draftIdsRef.current.includes(data.draftId)) {
          return;
        }

        setApprovalStates(prev => {
          const newState = { ...prev };

          if (!newState[data.draftId]) {
            newState[data.draftId] = {
              isProcessing: false,
              currentImage: 0,
              totalImages: 0,
              progress: 0,
              status: 'idle',
            };
          }

          switch (data.type) {
            case 'approval_start':
              newState[data.draftId] = {
                isProcessing: true,
                currentImage: 0,
                totalImages: data.totalImages || 0,
                progress: 0,
                status: 'processing',
                lastEvent: data,
              };
              break;

            case 'approval_progress':
              const progress = data.totalImages
                ? Math.round((data.currentImage! / data.totalImages) * 100)
                : 0;

              newState[data.draftId] = {
                ...newState[data.draftId],
                currentImage: data.currentImage || 0,
                totalImages:
                  data.totalImages || newState[data.draftId].totalImages,
                progress,
                status: 'processing',
                lastEvent: data,
              };
              break;

            case 'approval_complete':
              newState[data.draftId] = {
                ...newState[data.draftId],
                isProcessing: false,
                progress: 100,
                status: data.success ? 'completed' : 'failed',
                lastEvent: data,
              };
              // Emit a lightweight row patch event for UI to update without reload
              setRowEvents(prev => [
                ...prev,
                {
                  id: data.draftId!,
                  patch: {
                    aiStatus: data.success ? 'completed' : 'failed',
                    aiProcessedAt: new Date().toISOString(),
                  },
                },
              ]);
              break;
            case 'ai_progress':
              // If progress message contains draftName/status, patch row fields as we go
              if (data.draftId) {
                const patch: any = {};
                if (data.draftName) patch.name = data.draftName;
                if (data.status === 'completed' || data.status === 'failed') {
                  patch.aiStatus = data.status;
                  patch.aiProcessedAt = new Date().toISOString();
                }
                if (Object.keys(patch).length > 0) {
                  setRowEvents(prev => [...prev, { id: data.draftId!, patch }]);
                }
              }
              break;
          }

          return newState;
        });
      } catch (error) {
        console.error('Error parsing approval event:', error);
      }
    };

    eventSource.onerror = error => {
      console.error(`❌ Error with approval events:`, error);
      console.error(`EventSource readyState:`, eventSource.readyState);
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [draftIds]); // Only recreate when draftIds change

  // Consumer can read approvalStates and rowEvents. rowEvents will accumulate; consumer should clear it after handling.
  return { approvalStates, isConnected, rowEvents, setRowEvents };
}
