import { useState } from 'react';

interface UseItemAvailabilityOptions {
  onSuccess?: (itemId: string, isAvailable: boolean | null) => void;
  onError?: (error: Error) => void;
}

export function useItemAvailability(options: UseItemAvailabilityOptions = {}) {
  const [loading, setLoading] = useState<string | null>(null);

  const updateAvailability = async (
    itemId: string,
    isAvailable: boolean | null
  ) => {
    if (loading === itemId) return; // Prevent multiple requests for the same item

    setLoading(itemId);

    try {
      const response = await fetch(
        `/api/gruzchik/order-items/${itemId}/availability`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isAvailable }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      const result = await response.json();

      if (result.success) {
        options.onSuccess?.(itemId, isAvailable);
      } else {
        throw new Error(result.error || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      options.onError?.(error as Error);
    } finally {
      setLoading(null);
    }
  };

  return {
    updateAvailability,
    loading,
    isUpdating: (itemId: string) => loading === itemId,
  };
}
