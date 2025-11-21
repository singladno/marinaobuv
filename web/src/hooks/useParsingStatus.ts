'use client';

import { useEffect, useState } from 'react';

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

  const fetchParsingStatus = async () => {
    try {
      const response = await fetch('/api/admin/parsing-status');
      const data: ParsingStatus = await response.json();

      if (response.ok) {
        setParsingStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch parsing status');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchParsingStatus();
      setLoading(false);
    };

    loadData();

    // Only refresh status every 5 seconds if polling is enabled
    if (enablePolling) {
      const interval = setInterval(fetchParsingStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [enablePolling]);

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
