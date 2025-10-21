'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface GruzchikFilters {
  availabilityStatus: 'all' | 'unset' | 'available' | 'unavailable';
  providerId: string | null;
  clientId: string | null;
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
  clientId: null,
};

export function GruzchikFilterProvider({
  children,
}: GruzchikFilterProviderProps) {
  const [filters, setFilters] = useState<GruzchikFilters>(defaultFilters);

  const updateFilter = <K extends keyof GruzchikFilters>(
    key: K,
    value: GruzchikFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters =
    filters.availabilityStatus !== 'all' ||
    filters.providerId !== null ||
    filters.clientId !== null;

  return (
    <GruzchikFilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        hasActiveFilters,
      }}
    >
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
