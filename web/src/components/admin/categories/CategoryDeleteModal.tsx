'use client';

import * as React from 'react';

import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { AdminCategoryNode, FlatAdminCategory } from '@/types/category';

type Props = {
  isOpen: boolean;
  category: AdminCategoryNode | FlatAdminCategory | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CategoryDeleteModal({
  isOpen,
  category,
  isDeleting,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Удалить категорию"
      message={
        category
          ? `Вы уверены, что хотите удалить категорию "${category.name}"? Это действие нельзя отменить. Категория может быть удалена только если в ней нет активных товаров.`
          : ''
      }
      confirmText="Удалить"
      cancelText="Отмена"
      variant="danger"
      isLoading={isDeleting}
    />
  );
}
