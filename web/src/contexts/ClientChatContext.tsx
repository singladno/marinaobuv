'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ClientChatContextType {
  isClientChatOpen: boolean;
  setClientChatOpen: (isOpen: boolean) => void;
}

const ClientChatContext = createContext<ClientChatContextType | undefined>(
  undefined
);

export function ClientChatProvider({ children }: { children: ReactNode }) {
  const [isClientChatOpen, setIsClientChatOpen] = useState(false);

  return (
    <ClientChatContext.Provider
      value={{
        isClientChatOpen,
        setClientChatOpen: setIsClientChatOpen,
      }}
    >
      {children}
    </ClientChatContext.Provider>
  );
}

export function useClientChat() {
  const context = useContext(ClientChatContext);
  if (context === undefined) {
    throw new Error('useClientChat must be used within a ClientChatProvider');
  }
  return context;
}
