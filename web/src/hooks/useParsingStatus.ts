'use client';

import { useCallback, useEffect, useState } from 'react';

import { deduplicateRequest } from '@/lib/request-deduplication';

interface ParsingStatus {
  runningParsers: number;
  runningParsersDetails: Array<{
    id: string;
    startedAt: string;
    messagesRead: number;
    productsCreated: number;
  }>;
  latestCompleted: any;
  latestFailed: any;
  stats: {
    last24Hours: {
      runs: number;
      messagesRead: number;
      productsCreated: number;
    };
    last7Days: {
      runs: number;
      messagesRead: number;
      productsCreated: number;
    };
  };
  error?: string;
}

export function useParsingStatus(enablePolling = false) {
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParsingStatus = useCallback(async () => {
    try {
      const result = await deduplicateRequest(
        'admin-parsing-status',
        async () => {
          const response = await fetch('/api/admin/parsing-status');
          const data: ParsingStatus = await response.json();
          return { ok: response.ok, data };
        }
      );
      if (result.ok) {
        setParsingStatus(result.data);
        setError(null);
      } else {
        setError(
          (result.data as { error?: string }).error ||
            'Failed to fetch parsing status'
        );
      }
    } catch {
      setError('Network error');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchParsingStatus();
      setLoading(false);
    };

    void loadData();

    if (enablePolling) {
      const interval = setInterval(() => void fetchParsingStatus(), 5000);
      return () => clearInterval(interval);
    }
  }, [enablePolling, fetchParsingStatus]);

  return {
    parsingStatus,
    loading,
    error,
    isParsingActive: parsingStatus?.runningParsers
      ? parsingStatus.runningParsers > 0
      : false,
    refreshStatus: fetchParsingStatus,
  };
}
