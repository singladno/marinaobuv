'use client';

import { AdminWhatsAppChatPanel } from '@/components/admin/AdminWhatsAppChatPanel';
import { useUser } from '@/contexts/NextAuthUserContext';
import { useWhatsAppInbox } from '@/contexts/WhatsAppInboxContext';

/** Single mounted WhatsApp inbox (avoids duplicate panels from mobile + desktop switchers). */
export function WhatsAppInboxPanelHost() {
  const { user } = useUser();
  const { isOpen, closeInbox, highlightChatIds } = useWhatsAppInbox();

  if (user?.role !== 'ADMIN') return null;

  return (
    <AdminWhatsAppChatPanel
      open={isOpen}
      onClose={closeInbox}
      highlightChatIds={highlightChatIds}
    />
  );
}
