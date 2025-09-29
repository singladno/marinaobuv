import * as React from 'react';

import { CompactModal } from './CompactModal';
import { ConfirmationModalButtons } from './ConfirmationModalButtons';
import { ConfirmationModalIcon } from './ConfirmationModalIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = React.useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <CompactModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <ConfirmationModalIcon variant={variant} />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>

      <ConfirmationModalButtons
        onClose={onClose}
        onConfirm={handleConfirm}
        confirmText={confirmText}
        cancelText={cancelText}
        variant={variant}
        isLoading={isLoading}
      />
    </CompactModal>
  );
}
