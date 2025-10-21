'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminChatContextType {
  isAdminChatOpen: boolean;
  setAdminChatOpen: (isOpen: boolean) => void;
}

const AdminChatContext = createContext<AdminChatContextType | undefined>(
  undefined
);

export function AdminChatProvider({ children }: { children: ReactNode }) {
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);

  return (
    <AdminChatContext.Provider
      value={{
        isAdminChatOpen,
        setAdminChatOpen: setIsAdminChatOpen,
      }}
    >
      {children}
    </AdminChatContext.Provider>
  );
}

export function useAdminChat() {
  const context = useContext(AdminChatContext);
  if (context === undefined) {
    throw new Error('useAdminChat must be used within an AdminChatProvider');
  }
  return context;
}
