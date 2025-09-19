import * as React from 'react';

import { useHighlightedProducts } from '@/contexts/HighlightedProductsContext';

interface UseProductSplitProps {
  draftId: string;
  onSuccess?: () => void;
}

export function useProductSplit({ draftId, onSuccess }: UseProductSplitProps) {
  const [isSplitting, setIsSplitting] = React.useState(false);
  const { highlightProducts } = useHighlightedProducts();

  const splitProduct = React.useCallback(
    async (imageIds: string[]) => {
      if (isSplitting || imageIds.length === 0) return;

      setIsSplitting(true);
      try {
        const response = await fetch('/api/admin/drafts/split', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draftId,
            imageIds,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to split product');
        }

        const result = await response.json();

        if (result.success) {
          // Highlight both products
          highlightProducts([draftId, result.data.newDraftId]);

          // Call success callback (e.g., close modal, refresh data)
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error) {
        console.error('Error splitting product:', error);
        throw error;
      } finally {
        setIsSplitting(false);
      }
    },
    [draftId, isSplitting, highlightProducts, onSuccess]
  );

  return {
    splitProduct,
    isSplitting,
  };
}
