'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

import { GruzchikFilterProvider } from './GruzchikFilterContext';

export type ViewMode = 'provider' | 'order';

interface GruzchikViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const GruzchikViewContext = createContext<GruzchikViewContextType | undefined>(
  undefined
);

interface GruzchikViewProviderProps {
  children: ReactNode;
  initialMode?: ViewMode;
}

export function GruzchikViewProvider({
  children,
  initialMode = 'provider',
}: GruzchikViewProviderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <GruzchikFilterProvider>
      <GruzchikViewContext.Provider
        value={{ viewMode, setViewMode, searchQuery, setSearchQuery }}
      >
        {children}
      </GruzchikViewContext.Provider>
    </GruzchikFilterProvider>
  );
}

export function useGruzchikView() {
  const context = useContext(GruzchikViewContext);
  if (context === undefined) {
    throw new Error(
      'useGruzchikView must be used within a GruzchikViewProvider'
    );
  }
  return context;
}
