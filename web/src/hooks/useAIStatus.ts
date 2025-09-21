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

    // Only poll if not using WebSocket events (when isRunningAI is not provided)
    if (isRunningAI === undefined) {
      const interval = setInterval(() => {
        if (data?.counts.processing > 0) {
          fetchAIStatus();
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [fetchAIStatus, data?.counts.processing, isRunningAI]);

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
