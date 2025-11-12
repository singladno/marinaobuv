import { useState, useCallback, useRef, useEffect } from 'react';

export function useColorAutocomplete(value: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/colors?q=${encodeURIComponent(query)}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.colors || []);
      setIsOpen(data.colors && data.colors.length > 0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching color suggestions:', err);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    // Don't fetch if we just selected a value (prevents reopening dropdown)
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, fetchSuggestions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, suggestions.length]
  );

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length]);

  const handleSelect = useCallback(
    (color: string, onSelect: (color: string) => void) => {
      justSelectedRef.current = true;
      onSelect(color);
      setIsOpen(false);
      setSuggestions([]);
      setHighlightedIndex(-1);
    },
    []
  );

  const resetHighlight = useCallback(() => {
    setHighlightedIndex(-1);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    suggestions,
    isOpen,
    isLoading,
    highlightedIndex,
    handleKeyDown,
    handleInputFocus,
    handleSelect,
    resetHighlight,
    closeDropdown,
  };
}
