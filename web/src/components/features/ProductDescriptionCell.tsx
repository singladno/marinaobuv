'use client';

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';
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
  // Always show edit control
  const [isEditing] = useState(true);
  const [value, setValue] = useState(product.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea to fit content
  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, []);

  useEffect(() => {
    resize();
  }, [value]);

  const handleSave = async () => {
    if (value === product.description) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateProduct(product.id, { description: value || null });
      // stay in edit mode
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="min-w-[200px]">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => handleSave()}
        onKeyDown={handleKeyDown}
        disabled={isLoading || product.isActive}
        className="w-full"
        rows={1}
        placeholder="Описание товара..."
      />
      {isLoading && (
        <div className="mt-1 text-xs text-gray-500">Сохранение...</div>
      )}
    </div>
  );
}
