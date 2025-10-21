import * as React from 'react';

import { useCategories } from './useCategories';
import { useDrafts } from './useDrafts';

export function useDraftTableData(initialStatus: string) {
  const {
    data,
    loading,
    error,
    reload,
    reloadSilent,
    status,
    setStatus,
    pagination,
    goToPage,
    changePageSize,
  } = useDrafts();
  const { categories, loading: categoriesLoading } = useCategories();

  // Set initial status from URL params only on mount
  React.useEffect(() => {
    if (initialStatus && initialStatus !== status) {
      setStatus(initialStatus);
    }
  }, [initialStatus, setStatus, status]);

  // Use data directly since AI status functionality was removed
  const mergedData = React.useMemo(() => {
    return data;
  }, [data]);

  return {
    data: mergedData,
    loading: loading || categoriesLoading,
    error,
    categories,
    status,
    pagination,
    goToPage,
    changePageSize,
    reload,
    reloadSilent,
  };
}
