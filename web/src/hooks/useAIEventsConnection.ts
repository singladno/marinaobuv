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
      console.log('🔌 Closing existing AI SSE connection');
      eventSourceRef.current.close();
    }

    // Create EventSource for AI events
    console.log('🔌 Creating new EventSource for /api/ai-events');
    const eventSource = new EventSource('/api/ai-events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`🔌 Connected to AI events`);
      setIsConnected(true);
    };

    eventSource.onmessage = event => {
      try {
        const data: AIEvent = JSON.parse(event.data);
        // Handle ping events
        if (data.type === 'ping') {
          return;
        }

        switch (data.type) {
          case 'ai_start':
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
      console.error(`EventSource URL:`, eventSource.url);
      setIsConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 Attempting to reconnect AI events...');
          // The useEffect will handle reconnection
        }
      }, 5000);
    };

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return { aiState, isConnected };
}
