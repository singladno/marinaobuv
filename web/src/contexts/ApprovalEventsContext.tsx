import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

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

interface ApprovalEventsContextType {
  approvalStates: ApprovalState;
  isConnected: boolean;
  getApprovalState: (draftId: string) => {
    isProcessing: boolean;
    currentImage: number;
    totalImages: number;
    progress: number;
    status: 'idle' | 'processing' | 'completed' | 'failed';
  };
  updateDraftIds: (draftIds: string[]) => void;
  isAnyDraftApproving: (draftIds: string[]) => boolean;
  getApprovingDrafts: (draftIds: string[]) => string[];
}

const ApprovalEventsContext = createContext<ApprovalEventsContextType | null>(
  null
);

interface ApprovalEventsProviderProps {
  children: React.ReactNode;
  draftIds?: string[];
}

export function ApprovalEventsProvider({
  children,
  draftIds: initialDraftIds = [],
}: ApprovalEventsProviderProps) {
  const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>(initialDraftIds);
  const eventSourceRef = useRef<EventSource | null>(null);
  const draftIdsRef = useRef<string[]>([]);

  // Update the ref when draftIds change
  useEffect(() => {
    draftIdsRef.current = draftIds;
  }, [draftIds]);

  // Function to update draft IDs
  const updateDraftIds = useCallback((newDraftIds: string[]) => {
    setDraftIds(newDraftIds);
  }, []);

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

  const isAnyDraftApproving = useCallback(
    (draftIds: string[]) => {
      return draftIds.some(draftId => {
        const state = approvalStates[draftId];
        return state?.isProcessing || false;
      });
    },
    [approvalStates]
  );

  const getApprovingDrafts = useCallback(
    (draftIds: string[]) => {
      return draftIds.filter(draftId => {
        const state = approvalStates[draftId];
        return state?.isProcessing || false;
      });
    },
    [approvalStates]
  );

  return (
    <ApprovalEventsContext.Provider
      value={{
        approvalStates,
        isConnected,
        getApprovalState,
        updateDraftIds,
        isAnyDraftApproving,
        getApprovingDrafts,
      }}
    >
      {children}
    </ApprovalEventsContext.Provider>
  );
}

export function useApprovalEvents() {
  const context = useContext(ApprovalEventsContext);
  if (!context) {
    throw new Error(
      'useApprovalEvents must be used within an ApprovalEventsProvider'
    );
  }
  return context;
}
