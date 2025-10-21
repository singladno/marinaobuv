import * as React from 'react';

import type { Draft } from '@/types/admin';

export function useDraftTableOperations({
  reload,
  reloadSilent,
}: {
  reload: () => Promise<void>;
  reloadSilent: () => Promise<void>;
}) {
  const inlinePatch = React.useCallback(
    async (id: string, patch: Partial<Draft>) => {
      // Transform sizes data to database format
      if (patch.sizes) {
        const transformedSizes = patch.sizes.map(size => ({
          size: size.size,
          stock: size.quantity,
          count: size.quantity,
        }));
        patch = { ...patch, sizes: transformedSizes };
      }

      await fetch(`/api/admin/drafts`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ id, data: patch }),
      });
      // Don't reload for size or image updates as they are handled optimistically
      // Only reload for other field changes that might affect the display
      if (!('sizes' in patch) && !('images' in patch)) {
        await reloadSilent();
      }
    },
    [reloadSilent]
  );

  const deleteDraft = React.useCallback(
    async (id: string) => {
      try {
        await fetch('/api/admin/drafts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            isDeleted: true,
          }),
        });
        await reload();
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    },
    [reload]
  );

  const toggleImage = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      const response = await fetch(`/api/admin/drafts/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update image status: ${response.status}`);
      }

      // No reload needed - images are handled optimistically
      return response.json();
    },
    []
  );

  return {
    inlinePatch,
    deleteDraft,
    toggleImage,
  };
}
