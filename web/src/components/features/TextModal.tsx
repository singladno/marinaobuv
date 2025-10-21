import * as React from 'react';

import { Modal } from '@/components/ui/Modal';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null | undefined;
  placeholder?: string;
}

export function TextModal({
  isOpen,
  onClose,
  title,
  content,
  placeholder = 'Нет данных',
}: TextModalProps) {
  if (!content) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="p-6">
        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
          {content || placeholder}
        </div>
      </div>
    </Modal>
  );
}
