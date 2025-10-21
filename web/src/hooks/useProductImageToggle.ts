import * as React from 'react';

export function useProductImageToggle({ onReload }: { onReload?: () => void }) {
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

  const handleToggle = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      setIsUpdating(imageId);
      try {
        const res = await fetch(`/api/admin/products/images/${imageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        });
        if (!res.ok) throw new Error('Failed to toggle image status');
        if (onReload) onReload();
      } finally {
        setIsUpdating(null);
      }
    },
    [onReload]
  );

  return { handleToggle, isUpdating };
}
