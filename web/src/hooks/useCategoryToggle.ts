import * as React from 'react';

import type { FlatAdminCategory } from '@/types/category';

export function useCategoryToggle(
  category: FlatAdminCategory | null,
  onReload?: () => void
) {
  const [isToggling, setIsToggling] = React.useState(false);
  const [optimisticIsActive, setOptimisticIsActive] = React.useState<
    boolean | null
  >(null);

  React.useEffect(() => {
    if (category) {
      setOptimisticIsActive(null);
    }
  }, [category]);

  const handleToggleActive = React.useCallback(
    async (checked: boolean) => {
      if (!category || isToggling) return;

      const previousValue = category.isActive;
      setOptimisticIsActive(checked);
      setIsToggling(true);

      try {
        const response = await fetch(`/api/admin/categories/${category.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: category.name,
            parentId: category.parentId,
            urlSegment: category.segment,
            isActive: checked,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data?.error || 'Ошибка обновления категории');
        }

        if (onReload) {
          onReload();
        }
      } catch (error) {
        console.error('Error toggling category active status:', error);
        setOptimisticIsActive(previousValue);
      } finally {
        setIsToggling(false);
      }
    },
    [category, isToggling, onReload]
  );

  const isActive =
    optimisticIsActive !== null
      ? optimisticIsActive
      : (category?.isActive ?? false);

  return {
    isToggling,
    isActive,
    handleToggleActive,
  };
}
