import * as React from 'react';

export function useImageToggle() {
  const [savingStatus, setSavingStatus] = React.useState<{
    isSaving: boolean;
    message: string;
  }>({ isSaving: false, message: '' });

  const handleImageToggle = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      setSavingStatus({ isSaving: true, message: 'Сохранение...' });

      try {
        const response = await fetch(`/api/admin/drafts/images/${imageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        });

        if (!response.ok) {
          throw new Error('Failed to update image status');
        }

        const result = await response.json();
        setSavingStatus({ isSaving: false, message: 'Сохранено' });

        // Clear success message after 2 seconds
        setTimeout(() => {
          setSavingStatus({ isSaving: false, message: '' });
        }, 2000);

        return result.image;
      } catch (error) {
        console.error('Failed to toggle image status:', error);
        setSavingStatus({ isSaving: false, message: 'Ошибка сохранения' });

        // Clear error message after 3 seconds
        setTimeout(() => {
          setSavingStatus({ isSaving: false, message: '' });
        }, 3000);
        throw error;
      }
    },
    []
  );

  return {
    handleImageToggle,
    savingStatus,
  };
}
