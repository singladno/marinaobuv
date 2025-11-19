'use client';
import { useEffect, useRef, useState } from 'react';
import { useTextareaAutoResize } from '@/hooks/useTextareaAutoResize';
import type { ProductUpdateData } from '@/types/product';
import { ProductDescriptionEditor } from './ProductDescriptionEditor';
import { ProductDescriptionPreview } from './ProductDescriptionPreview';

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
  const [value, setValue] = useState(product.description || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    setValue(product.description || '');
  }, [product.description]);
  const resize = useTextareaAutoResize(textareaRef, isExpanded, [value]);
  const handleSave = async () => {
    if (value === product.description) {
      return;
    }
    setIsLoading(true);
    try {
      await onUpdateProduct(product.id, { description: value || null });
    } catch (error) {
      console.error('Error updating description:', error);
      setValue(product.description || '');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCollapse = () => {
    setIsExpanded(false);
    void handleSave();
  };
  const handleBlur = () => {
    if (!isExpanded) return;
    handleCollapse();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSave();
    } else if (e.key === 'Escape') {
      handleCollapse();
    }
  };
  return (
    <div className="space-y-2">
      {!isExpanded && (
        <ProductDescriptionPreview
          value={value}
          isLoading={isLoading}
          onExpand={() => setIsExpanded(true)}
        />
      )}
      <ProductDescriptionEditor
        value={value}
        isExpanded={isExpanded}
        isLoading={isLoading}
        textareaRef={textareaRef}
        disabled={isLoading}
        onChange={next => {
          setValue(next);
          requestAnimationFrame(resize);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={resize}
        onCollapse={handleCollapse}
      />
    </div>
  );
}
