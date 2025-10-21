import { Info } from 'lucide-react';
import { useState } from 'react';

import { useUser } from '@/contexts/UserContext';

import { ProductSourceModal } from './ProductSourceModal';

interface ProductSourceButtonProps {
  productId: string;
  productName: string;
}

export function ProductSourceButton({
  productId,
  productName,
}: ProductSourceButtonProps) {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show for admin users
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-xl"
        title="Просмотр источника сообщений"
      >
        <Info className="h-4 w-4 text-gray-700" />
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
