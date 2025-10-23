'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';

interface SearchHistoryItem {
  id: string;
  query: string;
  createdAt: string;
}

interface SearchContextType {
  searchQuery: string;
  searchHistory: SearchHistoryItem[];
  setSearchQuery: (query: string) => void;
  handleSearch: (query: string) => void;
  fetchSearchHistory: () => void;
  clearSearchHistory: () => void;
  deleteSearchHistoryItem: (id: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const router = useRouter();

  // Fetch search history from backend
  const fetchSearchHistory = useCallback(async () => {
    try {
      console.log('SearchContext: Fetching from backend');
      const response = await fetch('/api/search-history');
      if (response.ok) {
        const data = await response.json();
        console.log('SearchContext: Backend response', data);
        console.log(
          'SearchContext: Search history length',
          data.searchHistory?.length || 0
        );
        setSearchHistory(data.searchHistory);
        return data.searchHistory.length > 0;
      }
      console.log('SearchContext: Backend response not ok', response.status);
      return false;
    } catch (err) {
      console.error('Failed to fetch search history:', err);
      return false;
    }
  }, []);

  // Load search history from localStorage for anonymous users
  const loadLocalSearchHistory = useCallback(() => {
    try {
      const localHistory = localStorage.getItem('searchHistory');
      console.log('SearchContext: Loading from localStorage', localHistory);
      if (localHistory) {
        const parsed = JSON.parse(localHistory);
        console.log('SearchContext: Parsed localStorage history', parsed);
        setSearchHistory(parsed);
      }
    } catch (err) {
      console.error('Failed to load local search history:', err);
    }
  }, []);

  // Save search to localStorage for anonymous users
  const saveToLocalSearchHistory = useCallback((query: string) => {
    try {
      const localHistory = localStorage.getItem('searchHistory');
      const history = localHistory ? JSON.parse(localHistory) : [];

      // Remove existing entry if it exists (case insensitive)
      const filtered = history.filter(
        (item: SearchHistoryItem) =>
          item.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new entry at the beginning
      const newHistory = [
        {
          id: Date.now().toString(),
          query,
          createdAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 10); // Keep only last 10 searches

      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (err) {
      console.error('Failed to save local search history:', err);
    }
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      console.log('SearchContext: handleSearch called with', query);
      setSearchQuery(query);

      // Save to local storage for all users as backup
      // Database saving happens via catalog API
      if (query.trim()) {
        console.log('SearchContext: Saving to localStorage');
        saveToLocalSearchHistory(query.trim());
      }

      // Navigate to catalog with search params using Next.js router
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.set('search', query);
      }

      // Use Next.js router for client-side navigation
      const url = searchParams.toString()
        ? `/catalog?${searchParams.toString()}`
        : '/catalog';

      console.log('SearchContext: Navigating to', url, 'with query:', query);
      router.push(url);

      // Dispatch a custom event to notify components of the search
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('searchPerformed', {
            detail: { query: query.trim() },
          })
        );
      }
    },
    [saveToLocalSearchHistory, router]
  );

  // Clear search history
  const clearSearchHistory = useCallback(async () => {
    try {
      // Clear from backend
      await fetch('/api/search-history', { method: 'DELETE' });
      // Clear local storage
      localStorage.removeItem('searchHistory');
      setSearchHistory([]);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  }, []);

  // Delete specific search history item
  const deleteSearchHistoryItem = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/search-history?id=${id}`, { method: 'DELETE' });
        fetchSearchHistory();
      } catch (err) {
        console.error('Failed to delete search history item:', err);
      }
    },
    [fetchSearchHistory]
  );

  // Load initial search history and reset search query
  useEffect(() => {
    const loadHistory = async () => {
      console.log('SearchContext: Loading history on page load');
      // Try to fetch from backend first (for logged-in users)
      const backendSuccess = await fetchSearchHistory();
      console.log('SearchContext: Backend success', backendSuccess);

      // If backend fetch failed or returned no results, try localStorage (for anonymous users)
      if (!backendSuccess) {
        console.log('SearchContext: Backend failed, trying localStorage');
        loadLocalSearchHistory();
      }
    };

    loadHistory();
    // Reset search query on page load to prevent prepopulation
    setSearchQuery('');
  }, [fetchSearchHistory, loadLocalSearchHistory]);

  const value: SearchContextType = {
    searchQuery,
    searchHistory,
    setSearchQuery,
    handleSearch,
    fetchSearchHistory,
    clearSearchHistory,
    deleteSearchHistoryItem,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
