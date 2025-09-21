import { useState, useEffect, useCallback } from 'react';

interface AIStatusData {
  drafts: Array<{
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  }>;
  counts: {
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
}

export function useAIStatus(status?: string, isRunningAI?: boolean) {
  const [data, setData] = useState<AIStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/admin/drafts/ai-status?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch AI status');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchAIStatus();

    // More aggressive polling when AI is running
    const pollInterval = isRunningAI ? 1000 : 2000; // 1 second when running, 2 seconds otherwise

    const interval = setInterval(() => {
      if (data?.counts.processing > 0 || isRunningAI) {
        fetchAIStatus();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [fetchAIStatus, data?.counts.processing, isRunningAI]);

  // Immediately fetch AI status when isRunningAI changes to true
  useEffect(() => {
    if (isRunningAI) {
      fetchAIStatus();
      // Also fetch again after a short delay to catch immediate updates
      const timeout = setTimeout(() => {
        fetchAIStatus();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isRunningAI, fetchAIStatus]);

  const isProcessing = data?.counts.processing > 0;
  const currentProcessingDraft = data?.drafts.find(
    d => d.aiStatus === 'ai_processing'
  );

  return {
    data,
    loading,
    error,
    isProcessing,
    currentProcessingDraft,
    refetch: fetchAIStatus,
  };
}
