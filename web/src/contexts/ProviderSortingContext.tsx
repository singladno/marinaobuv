'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export interface Provider {
  id: string;
  name: string;
}

const STORAGE_KEY = 'gruzchik-provider-sorting';

interface ProviderSortingContextType {
  sortedProviderIds: string[];
  getSortedProviders: (providers: Provider[]) => Provider[];
  handleDragEnd: (result: any, providers: Provider[]) => void;
  clearSorting: () => void;
  hasCustomSorting: boolean;
}

const ProviderSortingContext = createContext<
  ProviderSortingContextType | undefined
>(undefined);

export function ProviderSortingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sortedProviderIds, setSortedProviderIds] = useState<string[]>([]);

  // Load sorting from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSortedProviderIds(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load provider sorting from localStorage:', error);
    }
  }, []);

  // Save sorting to localStorage whenever it changes
  const saveSorting = useCallback((newSorting: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSorting));
      setSortedProviderIds(newSorting);
    } catch (error) {
      console.warn('Failed to save provider sorting to localStorage:', error);
    }
  }, []);

  // Get sorted providers based on current sorting and available providers
  const getSortedProviders = useCallback(
    (providers: Provider[]): Provider[] => {
      if (providers.length === 0) return providers;

      // If no sorting is saved, return original order
      if (sortedProviderIds.length === 0) {
        return providers;
      }

      // Create a map for quick lookup
      const providerMap = new Map(providers.map(p => [p.id, p]));

      // Sort providers based on saved order
      const sorted: Provider[] = [];

      // First, add providers in the saved order
      sortedProviderIds.forEach(id => {
        const provider = providerMap.get(id);
        if (provider) {
          sorted.push(provider);
        }
      });

      // Then add any new providers that weren't in the saved order
      providers.forEach(provider => {
        if (!sortedProviderIds.includes(provider.id)) {
          sorted.push(provider);
        }
      });

      return sorted;
    },
    [sortedProviderIds]
  );

  // Update sorting when drag ends
  const handleDragEnd = useCallback(
    (result: any, providers: Provider[]) => {
      // Check if we have valid active and over elements
      if (!result.active || !result.over) {
        return;
      }

      // Get indices from the drag event
      const sourceIndex = result.active.data.current?.sortable?.index;
      const destinationIndex = result.over.data.current?.sortable?.index;

      // Validate indices
      if (sourceIndex === undefined || sourceIndex < 0) {
        return;
      }

      if (destinationIndex === undefined || destinationIndex < 0) {
        return;
      }

      if (sourceIndex === destinationIndex) {
        return;
      }

      // Get current provider IDs in the order they appear
      const currentProviderIds = providers.map(p => p.id);

      // If we have saved sorting, use it as base, otherwise use current order
      const baseOrder =
        sortedProviderIds.length > 0 ? sortedProviderIds : currentProviderIds;

      // Create new array with reordered items using arrayMove
      const newSorted = arrayMove(baseOrder, sourceIndex, destinationIndex);

      // Save new sorting
      saveSorting(newSorted);
    },
    [sortedProviderIds, saveSorting]
  );

  // Clear sorting (reset to original order)
  const clearSorting = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSortedProviderIds([]);
    } catch (error) {
      console.warn(
        'Failed to clear provider sorting from localStorage:',
        error
      );
    }
  }, []);

  const value: ProviderSortingContextType = {
    sortedProviderIds,
    getSortedProviders,
    handleDragEnd,
    clearSorting,
    hasCustomSorting: sortedProviderIds.length > 0,
  };

  return (
    <ProviderSortingContext.Provider value={value}>
      {children}
    </ProviderSortingContext.Provider>
  );
}

export function useProviderSorting() {
  const context = useContext(ProviderSortingContext);
  if (context === undefined) {
    throw new Error(
      'useProviderSorting must be used within a ProviderSortingProvider'
    );
  }
  return context;
}
