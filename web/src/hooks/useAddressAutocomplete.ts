'use client';

import { useState, useCallback, useRef } from 'react';

export interface AddressSuggestion {
  id: string;
  address: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface UseAddressAutocompleteReturn {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (query: string) => void;
  clearSuggestions: () => void;
}

// Cache for suggestions to reduce API calls
const suggestionCache = new Map<
  string,
  { suggestions: AddressSuggestion[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAddressAutocomplete(): UseAddressAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();

    // Check cache first
    const cached = suggestionCache.get(trimmedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setSuggestions(cached.suggestions);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/address/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmedQuery }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.suggestions)) {
        // Cache the results
        suggestionCache.set(trimmedQuery, {
          suggestions: data.suggestions,
          timestamp: Date.now(),
        });

        setSuggestions(data.suggestions);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      console.error('Address autocomplete error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSuggestions([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
