'use client';

import { useState } from 'react';
import { ProductUpdateData } from '@/types/product';

interface ProductDescriptionCellProps {
  product: {
    id: string;
    description: string | null;
    isActive: boolean;
  };
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductDescriptionCell({
  product,
  onUpdateProduct,
}: ProductDescriptionCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(product.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (value === product.description) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateProduct(product.id, { description: value || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating description:', error);
      // Reset to original value on error
      setValue(product.description || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(product.description || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="min-w-[200px]">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          rows={2}
          placeholder="Описание товара..."
          autoFocus
        />
        {isLoading && (
          <div className="mt-1 text-xs text-gray-500">Сохранение...</div>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-w-[200px] cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-50"
      onClick={() => !product.isActive && setIsEditing(true)}
      title={
        product.isActive
          ? 'Нельзя редактировать активный товар'
          : 'Нажмите для редактирования'
      }
    >
      {product.description ? (
        <div className="text-gray-900">{product.description}</div>
      ) : (
        <div className="italic text-gray-400">Нет описания</div>
      )}
    </div>
  );
}
