'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export interface PurchaseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number;
  sortIndex: number;
  color?: string | null;
  product: {
    id: string;
    slug: string;
    material?: string;
    sizes?: any;
    images: Array<{
      id: string;
      url: string;
      color?: string | null;
      isPrimary: boolean;
      sort: number;
    }>;
  };
}

const STORAGE_KEY_PREFIX = 'purchase-item-sorting-';

interface PurchaseItemSortingContextType {
  sortedItemIds: string[];
  getSortedItems: (items: PurchaseItem[], purchaseId: string) => PurchaseItem[];
  handleDragEnd: (
    result: any,
    items: PurchaseItem[],
    purchaseId: string
  ) => void;
  clearSorting: (purchaseId: string) => void;
  hasCustomSorting: (purchaseId: string) => boolean;
}

const PurchaseItemSortingContext = createContext<
  PurchaseItemSortingContextType | undefined
>(undefined);

export function PurchaseItemSortingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sortedItemIds, setSortedItemIds] = useState<string[]>([]);
  const [currentPurchaseId, setCurrentPurchaseId] = useState<string | null>(
    null
  );
  const loadedPurchases = useRef<Set<string>>(new Set());

  // Load sorting for specific purchase
  const loadSortingForPurchase = useCallback((purchaseId: string) => {
    if (loadedPurchases.current.has(purchaseId)) {
      return;
    }

    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${purchaseId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSortedItemIds(parsed);
          setCurrentPurchaseId(purchaseId);
        }
      } else {
        setSortedItemIds([]);
        setCurrentPurchaseId(purchaseId);
      }
    } catch (error) {
      console.warn(
        'Failed to load purchase item sorting from localStorage:',
        error
      );
      setSortedItemIds([]);
      setCurrentPurchaseId(purchaseId);
    }

    loadedPurchases.current.add(purchaseId);
  }, []);

  // Load sorting when purchase ID changes
  useEffect(() => {
    if (currentPurchaseId) {
      loadSortingForPurchase(currentPurchaseId);
    }
  }, [currentPurchaseId, loadSortingForPurchase]);

  // Save sorting to localStorage whenever it changes
  const saveSorting = useCallback(
    (newSorting: string[], purchaseId: string) => {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${purchaseId}`;
        localStorage.setItem(storageKey, JSON.stringify(newSorting));
        setSortedItemIds(newSorting);
        setCurrentPurchaseId(purchaseId);
      } catch (error) {
        console.warn(
          'Failed to save purchase item sorting to localStorage:',
          error
        );
      }
    },
    []
  );

  // Get sorted items based on current sorting and available items
  const getSortedItems = useCallback(
    (items: PurchaseItem[], purchaseId: string): PurchaseItem[] => {
      if (items.length === 0) return items;

      // If we're not on the right purchase, return original order
      if (currentPurchaseId !== purchaseId) {
        return items;
      }

      // If no sorting is saved, return original order
      if (sortedItemIds.length === 0) {
        return items;
      }

      // Create a map for quick lookup
      const itemMap = new Map(items.map(item => [item.id, item]));

      // Sort items based on saved order
      const sorted: PurchaseItem[] = [];

      // First, add items in the saved order
      sortedItemIds.forEach(id => {
        const item = itemMap.get(id);
        if (item) {
          sorted.push(item);
        }
      });

      // Then add any new items that weren't in the saved order
      items.forEach(item => {
        if (!sortedItemIds.includes(item.id)) {
          sorted.push(item);
        }
      });

      return sorted;
    },
    [sortedItemIds, currentPurchaseId]
  );

  // Update sorting when drag ends
  const handleDragEnd = useCallback(
    (result: any, items: PurchaseItem[], purchaseId: string) => {
      // Check if we have valid active and over elements
      if (!result.active || !result.over) {
        return;
      }

      const { active, over } = result;

      // Get the sorted items to find the correct indices
      const sortedItems = getSortedItems(items, purchaseId);

      // Find indices of active and over items in the sorted array
      const sourceIndex = sortedItems.findIndex(item => item.id === active.id);
      const destinationIndex = sortedItems.findIndex(
        item => item.id === over.id
      );

      // Validate indices
      if (sourceIndex === -1 || destinationIndex === -1) {
        return;
      }

      if (sourceIndex === destinationIndex) {
        return;
      }

      // Get current item IDs in the order they appear
      const currentItemIds = sortedItems.map(item => item.id);

      // If we have saved sorting, use it as base, otherwise use current order
      const baseOrder =
        sortedItemIds.length > 0 ? sortedItemIds : currentItemIds;

      // Filter out null values from baseOrder
      const filteredBaseOrder = baseOrder.filter(id => id !== null);

      // Create new array with reordered items using arrayMove
      const newSorted = arrayMove(
        filteredBaseOrder,
        sourceIndex,
        destinationIndex
      );

      // Save new sorting
      saveSorting(newSorted, purchaseId);
    },
    [sortedItemIds, saveSorting, getSortedItems]
  );

  // Clear sorting (reset to original order)
  const clearSorting = useCallback((purchaseId: string) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${purchaseId}`;
      localStorage.removeItem(storageKey);
      setSortedItemIds([]);
      setCurrentPurchaseId(purchaseId);
      loadedPurchases.current.delete(purchaseId);
    } catch (error) {
      console.warn(
        'Failed to clear purchase item sorting from localStorage:',
        error
      );
    }
  }, []);

  // Check if we have custom sorting for a purchase
  const hasCustomSorting = useCallback((purchaseId: string) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${purchaseId}`;
      const stored = localStorage.getItem(storageKey);
      return stored !== null;
    } catch (error) {
      return false;
    }
  }, []);

  const value: PurchaseItemSortingContextType = {
    sortedItemIds,
    getSortedItems,
    handleDragEnd,
    clearSorting,
    hasCustomSorting,
  };

  return (
    <PurchaseItemSortingContext.Provider value={value}>
      {children}
    </PurchaseItemSortingContext.Provider>
  );
}

export function usePurchaseItemSorting() {
  const context = useContext(PurchaseItemSortingContext);
  if (context === undefined) {
    throw new Error(
      'usePurchaseItemSorting must be used within a PurchaseItemSortingProvider'
    );
  }
  return context;
}
