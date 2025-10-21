'use client';

import { useState } from 'react';
import { ExternalLink, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useUser } from '@/contexts/UserContext';
import { ProductSourceModal } from './ProductSourceModal';

interface ProductSourceProps {
  productId: string;
  productName: string;
  sourceMessageIds?: string[] | null;
}

export function ProductSource({
  productId,
  productName,
  sourceMessageIds,
}: ProductSourceProps) {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show source section if no source messages or user is not admin
  if (
    !user ||
    user.role !== 'ADMIN' ||
    !sourceMessageIds ||
    sourceMessageIds.length === 0
  ) {
    return null;
  }

  const handleViewSource = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        <h3 className="font-medium">Источник</h3>
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">
              {sourceMessageIds.length} сообщени
              {sourceMessageIds.length === 1
                ? 'е'
                : sourceMessageIds.length < 5
                  ? 'я'
                  : 'й'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewSource}
            className="gap-2 text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Просмотреть
          </Button>
        </div>
      </div>

      <ProductSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
      />
    </>
  );
}
