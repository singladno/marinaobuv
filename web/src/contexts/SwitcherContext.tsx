'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SwitcherContextType {
  isSwitcherOpen: boolean;
  setIsSwitcherOpen: (isOpen: boolean) => void;
}

const SwitcherContext = createContext<SwitcherContextType | undefined>(
  undefined
);

export function SwitcherProvider({ children }: { children: ReactNode }) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  return (
    <SwitcherContext.Provider value={{ isSwitcherOpen, setIsSwitcherOpen }}>
      {children}
    </SwitcherContext.Provider>
  );
}

export function useSwitcher() {
  const context = useContext(SwitcherContext);
  if (context === undefined) {
    throw new Error('useSwitcher must be used within a SwitcherProvider');
  }
  return context;
}
