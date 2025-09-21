import { useEffect, useRef, useState } from 'react';
import type {
  ApprovalEvent,
  ApprovalState,
} from '@/contexts/ApprovalEventsContext';

export function useApprovalEventsConnection(draftIds: string[]) {
  const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
  const [isConnected, setIsConnected] = useState(false);
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

  return { approvalStates, isConnected };
}
