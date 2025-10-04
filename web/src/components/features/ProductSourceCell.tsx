import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { ProductSourceModal } from '@/components/product/ProductSourceModal';

interface ProductSourceCellProps {
  sourceMessageIds: string[] | null;
  productId: string;
  productName: string;
}

export function ProductSourceCell({
  sourceMessageIds,
  productId,
  productName,
}: ProductSourceCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!sourceMessageIds || sourceMessageIds.length === 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">—</div>;
  }

  const handleViewSource = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleViewSource}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        title={`Просмотреть ${sourceMessageIds.length} источник${sourceMessageIds.length === 1 ? '' : sourceMessageIds.length < 5 ? 'а' : 'ов'}`}
      >
        <MessageSquare className="h-4 w-4" />
      </button>

      <ProductSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
      />
    </>
  );
}
