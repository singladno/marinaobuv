import { VisibilityState } from '@tanstack/react-table';
import * as React from 'react';

// Custom hook for persistent column visibility
export function usePersistentColumnVisibility(
  storageKey: string,
  defaultVisibility: VisibilityState
) {
  const STORAGE_VERSION = '1.2';

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      if (typeof window === 'undefined') {
        return defaultVisibility;
      }

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);

          // Check if the saved data has the expected structure
          if (parsed && typeof parsed === 'object') {
            // If it's the old format (direct VisibilityState), migrate it
            if (!parsed.version) {
              return { ...defaultVisibility, ...parsed };
            }

            // If version matches, use the data
            if (parsed.version === STORAGE_VERSION && parsed.visibility) {
              return { ...defaultVisibility, ...parsed.visibility };
            }
          }
        }
      } catch (error) {
        console.warn(
          'Failed to load column visibility from localStorage:',
          error
        );
      }

      return defaultVisibility;
    });

  const updateColumnVisibility = React.useCallback(
    (
      updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)
    ) => {
      setColumnVisibility(prev => {
        const newVisibility =
          typeof updater === 'function' ? updater(prev) : updater;

        // Save to localStorage
        try {
          const dataToSave = {
            version: STORAGE_VERSION,
            visibility: newVisibility,
          };
          localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        } catch (error) {
          console.warn(
            'Failed to save column visibility to localStorage:',
            error
          );
        }

        return newVisibility;
      });
    },
    [storageKey]
  );

  return [columnVisibility, updateColumnVisibility] as const;
}
