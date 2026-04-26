'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type WhatsAppInboxContextType = {
  isOpen: boolean;
  /** Green API chat ids (`...@c.us`) to highlight in the sidebar */
  highlightChatIds: string[];
  openInbox: (opts?: { highlightChatIds?: string[] }) => void;
  closeInbox: () => void;
};

const WhatsAppInboxContext = createContext<WhatsAppInboxContextType | null>(
  null
);

export function WhatsAppInboxProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightChatIds, setHighlightChatIds] = useState<string[]>([]);

  const openInbox = useCallback((opts?: { highlightChatIds?: string[] }) => {
    setHighlightChatIds(
      opts?.highlightChatIds?.length ? [...new Set(opts.highlightChatIds)] : []
    );
    setIsOpen(true);
  }, []);

  const closeInbox = useCallback(() => {
    setIsOpen(false);
    setHighlightChatIds([]);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      highlightChatIds,
      openInbox,
      closeInbox,
    }),
    [isOpen, highlightChatIds, openInbox, closeInbox]
  );

  return (
    <WhatsAppInboxContext.Provider value={value}>
      {children}
    </WhatsAppInboxContext.Provider>
  );
}

export function useWhatsAppInbox() {
  const ctx = useContext(WhatsAppInboxContext);
  if (!ctx) {
    throw new Error(
      'useWhatsAppInbox must be used within WhatsAppInboxProvider'
    );
  }
  return ctx;
}
