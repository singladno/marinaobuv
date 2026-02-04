'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

export interface GruzchikFilters {
  availabilityStatus: 'all' | 'unset' | 'available' | 'unavailable';
  providerId: string | null; // For backward compatibility with availability page
  providerIds: string[]; // For multi-select in purchase page
  clientId: string | null;
  showImages: boolean; // Show images from chat
}

interface GruzchikFilterContextType {
  filters: GruzchikFilters;
  setFilters: (filters: GruzchikFilters) => void;
  updateFilter: <K extends keyof GruzchikFilters>(
    key: K,
    value: GruzchikFilters[K]
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const GruzchikFilterContext = createContext<
  GruzchikFilterContextType | undefined
>(undefined);

interface GruzchikFilterProviderProps {
  children: ReactNode;
}

const defaultFilters: GruzchikFilters = {
  availabilityStatus: 'all',
  providerId: null,
  providerIds: [],
  clientId: null,
  showImages: false,
};

export function GruzchikFilterProvider({
  children,
}: GruzchikFilterProviderProps) {
  // Load showImages preference from localStorage
  const [filters, setFilters] = useState<GruzchikFilters>(() => {
    const savedShowImages = localStorage.getItem('gruzchik-show-images');
    return {
      ...defaultFilters,
      showImages: savedShowImages === 'true',
    };
  });

  // Save showImages preference to localStorage
  useEffect(() => {
    localStorage.setItem('gruzchik-show-images', String(filters.showImages));
  }, [filters.showImages]);

  const updateFilter = useCallback(
    <K extends keyof GruzchikFilters>(key: K, value: GruzchikFilters[K]) => {
      console.log('[GruzchikFilterContext] updateFilter called', {
        key,
        value,
        valueType: typeof value,
      });
      setFilters(prev => {
        console.log('[GruzchikFilterContext] Current filters (prev):', prev);
        const newFilters = { ...prev, [key]: value };
        console.log('[GruzchikFilterContext] New filters:', newFilters);
        return newFilters;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.availabilityStatus !== 'all' ||
      filters.providerId !== null ||
      filters.providerIds.length > 0 ||
      filters.clientId !== null,
    [filters.availabilityStatus, filters.providerId, filters.providerIds, filters.clientId]
  );

  const contextValue = useMemo(
    () => ({
      filters,
      setFilters,
      updateFilter,
      clearFilters,
      hasActiveFilters,
    }),
    [filters, setFilters, updateFilter, clearFilters, hasActiveFilters]
  );

  return (
    <GruzchikFilterContext.Provider value={contextValue}>
      {children}
    </GruzchikFilterContext.Provider>
  );
}

export function useGruzchikFilter() {
  const context = useContext(GruzchikFilterContext);
  if (context === undefined) {
    throw new Error(
      'useGruzchikFilter must be used within a GruzchikFilterProvider'
    );
  }
  return context;
}
