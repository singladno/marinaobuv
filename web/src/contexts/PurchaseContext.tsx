'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type SetStateAction,
  type Dispatch,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

import { deduplicateRequest } from '@/lib/request-deduplication';

import { useUser } from './NextAuthUserContext';

interface Purchase {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    color?: string | null;
    name: string;
    price: number;
    sortIndex: number;
  }>;
  _count: {
    items: number;
  };
}

interface PurchaseContextType {
  isPurchaseMode: boolean;
  setIsPurchaseMode: (value: boolean) => void;
  activePurchase: Purchase | null;
  setActivePurchase: (purchase: Purchase | null) => void;
  purchases: Purchase[];
  setPurchases: Dispatch<SetStateAction<Purchase[]>>;
  selectedProductIds: Set<string>;
  addProductToPurchase: (
    productId: string,
    color?: string | null
  ) => Promise<void>;
  removeProductFromPurchase: (productId: string, color?: string | null) => void;
  refreshPurchases: () => Promise<void>;
  updateActivePurchaseItems: (items: any[]) => void;
  clearPurchaseState: () => void;
  loading: boolean;
  error: string | null;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(
  undefined
);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();
  /** `/admin/purchases/:id` — defer list fetch so it does not compete with the detail request. */
  const isAdminPurchaseDetailPage =
    pathname != null && /^\/admin\/purchases\/[^/]+$/.test(pathname);

  // Initialize state from localStorage if available
  const [isPurchaseMode, setIsPurchaseMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('purchase-mode');
        return saved === 'true';
      } catch (error) {
        console.warn('Failed to load purchase mode from localStorage:', error);
        return false;
      }
    }
    return false;
  });

  const [activePurchase, setActivePurchase] = useState<Purchase | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load saved active purchase ID from localStorage on mount
  const [savedActivePurchaseId, setSavedActivePurchaseId] = useState<
    string | null
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('active-purchase-id');
        return saved;
      } catch (error) {
        console.warn(
          'Failed to load active purchase ID from localStorage:',
          error
        );
        return null;
      }
    }
    return null;
  });

  // Mark as initialized after user is loaded
  useEffect(() => {
    if (user !== undefined) {
      setHasInitialized(true);
    }
  }, [user]);

  // Persist purchase mode state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user && hasInitialized) {
      try {
        localStorage.setItem('purchase-mode', isPurchaseMode.toString());
      } catch (error) {
        console.warn('Failed to save purchase mode to localStorage:', error);
      }
    }
  }, [isPurchaseMode, user, hasInitialized]);

  // Persist active purchase id when we have a selection.
  // Do NOT clear localStorage here when activePurchase is null: on first paint after refresh
  // purchase mode is already on but activePurchase is still null until `purchases` load and
  // the restore effect runs — clearing here would wipe `active-purchase-id` before restore.
  // Explicit clear is handled by `handleSetActivePurchase(null)` only.
  useEffect(() => {
    if (typeof window !== 'undefined' && user && hasInitialized) {
      try {
        if (activePurchase) {
          localStorage.setItem('active-purchase-id', activePurchase.id);
          setSavedActivePurchaseId(activePurchase.id);
        }
      } catch (error) {
        console.warn('Failed to save active purchase to localStorage:', error);
      }
    }
  }, [activePurchase, user, hasInitialized]);

  const refreshPurchases = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    try {
      setLoading(true);
      setError(null);
      const data = await deduplicateRequest(
        'admin-purchases-list',
        async () => {
          const response = await fetch('/api/admin/purchases');
          if (!response.ok) {
            throw new Error('Failed to fetch purchases');
          }
          return response.json();
        }
      );
      setPurchases(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch purchases'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  // Fetch purchase list only when admin may need it (not on every page load).
  // Summary list is small; full items load when selecting a purchase or restoring.
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      if (isPurchaseMode) {
        if (isAdminPurchaseDetailPage) {
          const id = window.setTimeout(() => {
            refreshPurchases();
          }, 300);
          return () => clearTimeout(id);
        }
        refreshPurchases();
      }
    } else if (user && user.role !== 'ADMIN') {
      // Only clear purchase state when we have a confirmed non-admin user
      // Don't clear on initial load when user is still loading
      clearPurchaseState();
    }
  }, [user, isPurchaseMode, refreshPurchases, isAdminPurchaseDetailPage]);

  // Restore active purchase from localStorage after purchases are loaded
  // Only restore when purchase mode is on and we have a saved ID, but NOT when
  // the user explicitly cleared the selection (savedActivePurchaseId would be null in that case)
  useEffect(() => {
    if (
      purchases.length > 0 &&
      !activePurchase &&
      savedActivePurchaseId &&
      isPurchaseMode
    ) {
      try {
        const savedPurchase = purchases.find(
          p => p.id === savedActivePurchaseId
        );
        if (!savedPurchase) {
          setSavedActivePurchaseId(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('active-purchase-id');
          }
          return;
        }

        const needsHydration =
          (savedPurchase._count?.items ?? 0) > 0 &&
          (!savedPurchase.items || savedPurchase.items.length === 0);

        if (needsHydration) {
          let cancelled = false;
          fetch(`/api/admin/purchases/${savedActivePurchaseId}`)
            .then(res => (res.ok ? res.json() : null))
            .then(full => {
              if (cancelled || !full) return;
              setPurchases(prev =>
                prev.map(p => (p.id === full.id ? full : p))
              );
              setActivePurchase(full);
            })
            .catch(() => {});
          return () => {
            cancelled = true;
          };
        }

        setActivePurchase(savedPurchase);
      } catch (error) {
        console.warn(
          'Failed to restore active purchase from localStorage:',
          error
        );
      }
    }
  }, [purchases, activePurchase, savedActivePurchaseId, isPurchaseMode]);

  // Update selected products when active purchase changes
  useEffect(() => {
    if (activePurchase) {
      const productIds = new Set(
        activePurchase.items.map(item => item.productId)
      );
      setSelectedProductIds(productIds);
    } else {
      setSelectedProductIds(new Set());
    }
  }, [activePurchase]);

  const addProductToPurchase = async (
    productId: string,
    color?: string | null
  ) => {
    if (!activePurchase || !user) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/purchases/${activePurchase.id}/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, color: color ?? null }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to add product to purchase');
      }

      const newItem = await response.json();

      // Update active purchase
      setActivePurchase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: [...prev.items, newItem].sort(
            (a, b) => a.sortIndex - b.sortIndex
          ),
          _count: {
            ...prev._count,
            items: prev._count.items + 1,
          },
        };
      });

      // Update purchases list
      setPurchases(prev =>
        prev.map(p =>
          p.id === activePurchase.id
            ? {
                ...p,
                items: [...p.items, newItem].sort(
                  (a, b) => a.sortIndex - b.sortIndex
                ),
                _count: {
                  ...p._count,
                  items: p._count.items + 1,
                },
              }
            : p
        )
      );

      // Add to selected products
      setSelectedProductIds(prev => new Set([...prev, productId]));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add product to purchase'
      );
      // Re-throw the error so the component can handle it
      throw err;
    }
  };

  const removeProductFromPurchase = async (
    productId: string,
    color?: string | null
  ) => {
    if (!activePurchase || !user) return;

    // Find the item to remove
    const itemToRemove = activePurchase.items.find(
      item =>
        item.productId === productId &&
        (color == null ? true : (item.color ?? null) === (color ?? null))
    );
    if (!itemToRemove) return;

    try {
      // Make API call to delete the item from database
      const response = await fetch(
        `/api/admin/purchases/${activePurchase.id}/items/${itemToRemove.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove product from purchase');
      }

      console.log('✅ Product removed successfully from database');

      // Remove from active purchase
      setActivePurchase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemToRemove.id),
          _count: {
            ...prev._count,
            items: prev._count.items - 1,
          },
        };
      });

      // Update purchases list
      setPurchases(prev =>
        prev.map(p =>
          p.id === activePurchase.id
            ? {
                ...p,
                items: p.items.filter(item => item.id !== itemToRemove.id),
                _count: {
                  ...p._count,
                  items: p._count.items - 1,
                },
              }
            : p
        )
      );

      // Remove from selected products if no items remain for product
      setSelectedProductIds(prev => {
        const stillHasThisProduct = activePurchase.items
          .filter(i => i.id !== itemToRemove.id)
          .some(i => i.productId === productId);
        if (stillHasThisProduct) return prev;
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (err) {
      console.error('❌ Failed to remove product from purchase:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to remove product from purchase'
      );
      // Re-throw the error so the component can handle it
      throw err;
    }
  };

  const updateActivePurchaseItems = (items: any[]) => {
    setActivePurchase(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: items,
      };
    });
  };

  const clearPurchaseState = () => {
    setIsPurchaseMode(false);
    setActivePurchase(null);
    setSelectedProductIds(new Set());
    setSavedActivePurchaseId(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('purchase-mode');
        localStorage.removeItem('active-purchase-id');
      } catch (error) {
        console.warn(
          'Failed to clear purchase state from localStorage:',
          error
        );
      }
    }
  };

  // Enhanced setIsPurchaseMode that clears transient state when turning off,
  // but keeps the last active purchase id for future restoration.
  const handleSetIsPurchaseMode = (value: boolean) => {
    setIsPurchaseMode(value);
    if (!value) {
      // When turning off purchase mode, clear the active purchase and selected products
      setActivePurchase(null);
      setSelectedProductIds(new Set());
      // Do NOT clear savedActivePurchaseId or localStorage here to allow restoration on next enable
    }
  };

  // Wrapper for setActivePurchase that handles clearing saved ID when explicitly clearing
  const handleSetActivePurchase = (purchase: Purchase | null) => {
    setActivePurchase(purchase);
    // If clearing while purchase mode is on, immediately clear saved ID to prevent restoration
    if (!purchase && isPurchaseMode) {
      setSavedActivePurchaseId(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('active-purchase-id');
        } catch (error) {
          console.warn(
            'Failed to clear active purchase from localStorage:',
            error
          );
        }
      }
    }
  };

  const value: PurchaseContextType = {
    isPurchaseMode,
    setIsPurchaseMode: handleSetIsPurchaseMode,
    activePurchase,
    setActivePurchase: handleSetActivePurchase,
    purchases,
    setPurchases,
    selectedProductIds,
    addProductToPurchase,
    removeProductFromPurchase,
    refreshPurchases,
    updateActivePurchaseItems,
    clearPurchaseState,
    loading,
    error,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
}
