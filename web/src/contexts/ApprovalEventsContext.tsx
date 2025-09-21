import React, { createContext, useCallback, useContext } from 'react';

import { useApprovalEventsConnection } from '@/hooks/useApprovalEventsConnection';

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
  const { approvalStates, isConnected } =
    useApprovalEventsConnection(initialDraftIds);

  // Function to update draft IDs
  const updateDraftIds = useCallback(() => {
    // This is handled by the hook now
  }, []);

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
