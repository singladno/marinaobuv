'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SourceMessagesModal } from '@/components/features/SourceMessagesModal';
import type { Product } from '@/types/product';

interface ProductSourceCellProps {
  product: Product;
}

export function ProductSourceCell({ product }: ProductSourceCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if product has source message IDs
  const hasSourceMessages =
    product.sourceMessageIds &&
    Array.isArray(product.sourceMessageIds) &&
    product.sourceMessageIds.length > 0;

  if (!hasSourceMessages) {
    return <div className="text-sm text-gray-400">Нет данных</div>;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="text-blue-600 hover:text-blue-800"
      >
        Показать ({product.sourceMessageIds?.length || 0})
      </Button>

      <SourceMessagesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
}
