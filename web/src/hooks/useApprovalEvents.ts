import { useEffect, useRef, useState } from 'react';

export interface ApprovalEvent {
  type:
    | 'connected'
    | 'approval_start'
    | 'approval_progress'
    | 'approval_complete'
    | 'ping';
  draftId: string;
  timestamp: number;
  // For approval_start
  totalImages?: number;
  // For approval_progress
  currentImage?: number;
  imageId?: string;
  imageUrl?: string;
  status?: 'uploading' | 'uploaded' | 'failed';
  // For approval_complete
  success?: boolean;
  totalProcessed?: number;
  totalFailed?: number;
  newS3Urls?: string[];
}

export interface ApprovalState {
  [draftId: string]: {
    isProcessing: boolean;
    currentImage: number;
    totalImages: number;
    progress: number; // 0-100
    status: 'idle' | 'processing' | 'completed' | 'failed';
    lastEvent?: ApprovalEvent;
  };
}

export function useApprovalEvents(draftIds: string[]) {
  const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const draftIdsRef = useRef<string[]>([]);

  // Update the ref when draftIds change
  useEffect(() => {
    draftIdsRef.current = draftIds;
  }, [draftIds]);

  useEffect(() => {
    if (draftIds.length === 0) return;

    console.log(
      `🔌 Creating single SSE connection for ${draftIds.length} drafts:`,
      draftIds
    );

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
  }, []); // Remove draftIds dependency to prevent recreation

  const getApprovalState = (draftId: string) => {
    return (
      approvalStates[draftId] || {
        isProcessing: false,
        currentImage: 0,
        totalImages: 0,
        progress: 0,
        status: 'idle',
      }
    );
  };

  return {
    isConnected,
    approvalStates,
    getApprovalState,
  };
}
