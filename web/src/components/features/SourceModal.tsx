import * as React from 'react';

import { Modal } from '@/components/ui/Modal';

import { SourceMessageItem } from './SourceMessageItem';

interface SourceMessage {
  id: string;
  waMessageId: string;
  from: string | null;
  fromName: string | null;
  type: string | null;
  text: string | null;
  timestamp: number | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  createdAt: string;
  provider: {
    name: string;
  } | null;
}

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SourceMessage[] | null | undefined;
}

export function SourceModal({ isOpen, onClose, source }: SourceModalProps) {
  if (!source || source.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Источник сообщений"
      size="xl"
    >
      <div className="space-y-4 p-6">
        {source.map(message => (
          <SourceMessageItem key={message.id} message={message} />
        ))}
      </div>
    </Modal>
  );
}
