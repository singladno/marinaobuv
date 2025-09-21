import { useEffect, useRef, useState } from 'react';

export interface AIEvent {
  type: 'connected' | 'ai_start' | 'ai_progress' | 'ai_complete' | 'ping';
  draftId?: string;
  timestamp: number;
  // For ai_start
  totalDrafts?: number;
  // For ai_progress
  currentDraft?: number;
  draftName?: string;
  status?: 'processing' | 'completed' | 'failed';
  // For ai_complete
  success?: boolean;
  totalProcessed?: number;
  totalFailed?: number;
}

export interface AIState {
  isRunning: boolean;
  currentDraft: number;
  totalDrafts: number;
  progress: number; // 0-100
  status: 'idle' | 'processing' | 'completed' | 'failed';
  lastEvent?: AIEvent;
}

export function useAIEventsConnection() {
  const [aiState, setAIState] = useState<AIState>({
    isRunning: false,
    currentDraft: 0,
    totalDrafts: 0,
    progress: 0,
    status: 'idle',
  });
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    console.log(`🔌 Creating AI SSE connection`);

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create EventSource for AI events
    const eventSource = new EventSource('/api/ai-events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`🔌 Connected to AI events`);
      setIsConnected(true);
    };

    eventSource.onmessage = event => {
      try {
        const data: AIEvent = JSON.parse(event.data);
        console.log('📡 Received AI event:', data);

        // Handle ping events
        if (data.type === 'ping') {
          return;
        }

        switch (data.type) {
          case 'ai_start':
            console.log('🚀 Processing ai_start event');
            setAIState({
              isRunning: true,
              currentDraft: 0,
              totalDrafts: data.totalDrafts || 0,
              progress: 0,
              status: 'processing',
              lastEvent: data,
            });
            break;

          case 'ai_progress':
            const progress = data.totalDrafts
              ? Math.round((data.currentDraft! / data.totalDrafts) * 100)
              : 0;

            console.log('📊 Processing ai_progress event:', {
              currentDraft: data.currentDraft,
              totalDrafts: data.totalDrafts,
              progress,
            });
            setAIState(prev => ({
              ...prev,
              currentDraft: data.currentDraft || 0,
              totalDrafts: data.totalDrafts || prev.totalDrafts,
              progress,
              status: 'processing',
              lastEvent: data,
            }));
            break;

          case 'ai_complete':
            console.log('✅ Processing ai_complete event:', {
              success: data.success,
            });
            setAIState(prev => ({
              ...prev,
              isRunning: false,
              progress: 100,
              status: data.success ? 'completed' : 'failed',
              lastEvent: data,
            }));
            break;
        }
      } catch (error) {
        console.error('Error parsing AI event:', error);
      }
    };

    eventSource.onerror = error => {
      console.error(`❌ Error with AI events:`, error);
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
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 AI state updated:', aiState);
  }, [aiState]);

  return { aiState, isConnected };
}
