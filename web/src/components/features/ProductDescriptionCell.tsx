'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setValue(product.description || '');
    setOptimisticValue(null);
  }, [product.description]);

  const resize = useTextareaAutoResize(textareaRef, isExpanded, [value]);

  const currentValue = optimisticValue ?? (product.description || '');

  const handleSave = async () => {
    const newValue = value || '';
    if (newValue === product.description) {
      return;
    }

    // Optimistic update - flush immediately to ensure UI updates
    flushSync(() => {
      setOptimisticValue(newValue);
      setIsLoading(true);
    });

    try {
      await onUpdateProduct(product.id, { description: newValue || null });
      // Success - keep optimistic value, sync value state
      setValue(newValue);
    } catch (error) {
      console.error('Error updating description:', error);
      // Revert on error
      setOptimisticValue(null);
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
          value={currentValue}
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
