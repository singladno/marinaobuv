import * as React from 'react';

export function useProductImageToggle({ onReload }: { onReload?: () => void }) {
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [removed, setRemoved] = React.useState<Record<string, boolean>>({});

  const handleDelete = React.useCallback(
    async (imageId: string, _isActive: boolean) => {
      setIsUpdating(imageId);
      try {
        const res = await fetch(`/api/admin/products/images/${imageId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete');
        setRemoved(prev => ({ ...prev, [imageId]: true }));
        if (onReload) onReload();
      } finally {
        setIsUpdating(null);
      }
    },
    [onReload]
  );

  return { handleDelete, isUpdating, removed };
}
