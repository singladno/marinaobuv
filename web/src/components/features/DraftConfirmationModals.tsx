'use client';

import * as React from 'react';

import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface DraftConfirmationModalsProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  showRestoreModal: boolean;
  setShowRestoreModal: (show: boolean) => void;
  showPermanentDeleteModal: boolean;
  setShowPermanentDeleteModal: (show: boolean) => void;
  selectedCount: number;
  onBulkDeleteConfirm: () => Promise<void>;
  onBulkRestoreConfirm: () => Promise<void>;
  onBulkPermanentDeleteConfirm: () => Promise<void>;
  isDeleting: boolean;
  isRestoring: boolean;
  isPermanentlyDeleting: boolean;
}

export function DraftConfirmationModals({
  showDeleteModal,
  setShowDeleteModal,
  showRestoreModal,
  setShowRestoreModal,
  showPermanentDeleteModal,
  setShowPermanentDeleteModal,
  selectedCount,
  onBulkDeleteConfirm,
  onBulkRestoreConfirm,
  onBulkPermanentDeleteConfirm,
  isDeleting,
  isRestoring,
  isPermanentlyDeleting,
}: DraftConfirmationModalsProps) {
  return (
    <>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={onBulkDeleteConfirm}
        title="Подтверждение удаления"
        message={`Вы уверены, что хотите удалить ${selectedCount} выбранных черновиков? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={onBulkRestoreConfirm}
        title="Подтверждение восстановления"
        message={`Вы уверены, что хотите восстановить ${selectedCount} выбранных черновиков?`}
        confirmText="Восстановить"
        cancelText="Отмена"
        variant="info"
        isLoading={isRestoring}
      />

      <ConfirmationModal
        isOpen={showPermanentDeleteModal}
        onClose={() => setShowPermanentDeleteModal(false)}
        onConfirm={onBulkPermanentDeleteConfirm}
        title="Подтверждение удаления навсегда"
        message={`Вы уверены, что хотите удалить навсегда ${selectedCount} выбранных черновиков? Это действие нельзя отменить и данные будут потеряны навсегда.`}
        confirmText="Удалить навсегда"
        cancelText="Отмена"
        variant="danger"
        isLoading={isPermanentlyDeleting}
      />
    </>
  );
}
