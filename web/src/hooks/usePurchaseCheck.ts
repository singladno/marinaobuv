import { useState, useEffect } from 'react';

interface PurchaseCheckResult {
  hasPurchased: boolean;
  orderId?: string;
  orderStatus?: string;
  purchaseDate?: string;
}

export function usePurchaseCheck(productId: string) {
  const [data, setData] = useState<PurchaseCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPurchase = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/products/${productId}/purchase-check`
        );

        if (!response.ok) {
          if (response.status === 401) {
            // User not logged in
            setData({ hasPurchased: false });
            return;
          }
          throw new Error('Failed to check purchase status');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setData({ hasPurchased: false });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      checkPurchase();
    }
  }, [productId]);

  return {
    data,
    loading,
    error,
    hasPurchased: data?.hasPurchased || false,
  };
}
