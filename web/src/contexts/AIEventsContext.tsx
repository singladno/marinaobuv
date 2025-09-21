import React, { createContext, useCallback, useContext } from 'react';

import { useAIEventsConnection } from '@/hooks/useAIEventsConnection';

export interface AIEvent {
  type: 'ai_start' | 'ai_progress' | 'ai_complete' | 'ping';
  draftId?: string;
  totalDrafts?: number;
  currentDraft?: number;
  draftName?: string;
  status?: string;
  success?: boolean;
  timestamp: number;
}

export interface AIState {
  isRunning: boolean;
  currentDraft: number;
  totalDrafts: number;
  progress: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  lastEvent?: AIEvent;
}

interface AIEventsContextType {
  aiState: AIState;
  isConnected: boolean;
}

const AIEventsContext = createContext<AIEventsContextType | undefined>(
  undefined
);

interface AIEventsProviderProps {
  children: React.ReactNode;
}

export function AIEventsProvider({ children }: AIEventsProviderProps) {
  const { aiState, isConnected } = useAIEventsConnection();

  return (
    <AIEventsContext.Provider value={{ aiState, isConnected }}>
      {children}
    </AIEventsContext.Provider>
  );
}

export function useAIEvents() {
  const context = useContext(AIEventsContext);
  if (context === undefined) {
    throw new Error('useAIEvents must be used within an AIEventsProvider');
  }
  return context;
}
