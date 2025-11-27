'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';
import { useProviderModels } from '@/hooks/useProviderModels';
import { CreateProviderModal } from '@/components/admin/CreateProviderModal';

interface Supplier {
  id: string;
  name: string | null;
  phone: string | null;
  place: string | null;
}

interface SupplierSelectorProps {
  value: string | null;
  onChange: (supplierId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

function SupplierSelectorComponent({
  value,
  onChange,
  placeholder = 'Выберите поставщика',
  disabled = false,
  isLoading = false,
}: SupplierSelectorProps) {
  const { providers, loading: providersLoading, reload: reloadProviders } = useProviderModels();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Helper function to find supplier (not a callback, just a function)
  const findSupplierById = (id: string): Supplier | null => {
    // Validate ID format (should be a valid cuid)
    if (!id || typeof id !== 'string' || id.length < 20) {
      return null;
    }

    const provider = providers.find(p => p.id === id);
    if (provider) {
      return {
        id: provider.id,
        name: provider.name,
        phone: provider.phone,
        place: provider.place,
      };
    }
    return null;
  };

  // CRITICAL: Initialize selectedSupplier from value immediately on mount
  // This prevents reset on remount
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    () => {
      // Try to find supplier from value immediately if providers are loaded
      if (value && !providersLoading && providers.length > 0) {
        const provider = providers.find(p => p.id === value);
        if (provider) {
          return {
            id: provider.id,
            name: provider.name,
            phone: provider.phone,
            place: provider.place,
          };
        }
      }
      return null;
    }
  );

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedValueRef = useRef<string | null>(null);
  const isSelectingRef = useRef(false);

  // Memoized version of findSupplierById for use in callbacks
  const findSupplierByIdMemo = useCallback(findSupplierById, [providers]);

  // Track previous value to avoid unnecessary updates
  const prevValueRef = useRef<string | null>(value);
  // Initialize prevSelectedSupplierRef with the initial selectedSupplier to prevent resets
  const prevSelectedSupplierRef = useRef<Supplier | null>(selectedSupplier);

  // Find selected supplier from shared list when value changes
  // Only sync when providers are loaded and value actually changed
  useEffect(() => {
    // Skip if value hasn't actually changed
    if (prevValueRef.current === value) {
      // Even if value hasn't changed, ensure selectedSupplier is in sync
      // This handles the case where component remounts and selectedSupplier is null but value is not
      if (
        !selectedSupplier &&
        value &&
        !providersLoading &&
        providers.length > 0
      ) {
        const supplier = findSupplierByIdMemo(value);
        if (supplier) {
          setSelectedSupplier(supplier);
          prevSelectedSupplierRef.current = supplier;
        }
      }
      return;
    }

    const hadSelection = prevSelectedSupplierRef.current !== null;
    prevValueRef.current = value;

    // Don't sync if we're in the middle of a selection
    if (isSelectingRef.current) {
      return;
    }

    if (!providersLoading && providers.length > 0) {
      if (
        value &&
        typeof value === 'string' &&
        value.length >= 20 &&
        value.length <= 30
      ) {
        // Skip if this is the value we just set in handleSelect (to prevent clearing)
        if (lastSelectedValueRef.current === value) {
          // Clear the ref after skipping once
          setTimeout(() => {
            lastSelectedValueRef.current = null;
          }, 100);
          return;
        }

        const supplier = findSupplierByIdMemo(value);
        if (supplier) {
          // Update if the supplier ID is different from current selection
          setSelectedSupplier(prev => {
            if (prev?.id !== supplier.id) {
              prevSelectedSupplierRef.current = supplier;
              return supplier;
            }
            return prev;
          });
        } else {
          // If supplier not found, don't clear - might be a timing issue
          // Only clear if current selection doesn't match value
          setSelectedSupplier(prev => {
            if (prev?.id === value) {
              // Current selection matches value but supplier not found - keep it
              return prev;
            }
            // Selection doesn't match value - but don't clear if we just set it
            return prev;
          });
        }
      } else if (!value) {
        // CRITICAL: Don't clear selection on remount if we have a selected supplier
        // Only clear if value is explicitly null AND we're not in the middle of initialization
        // This prevents resets when component remounts and value is briefly null
        if (hadSelection && selectedSupplier && selectedSupplier.id) {
          // Keep the current selection - value might be null temporarily during remount
          return;
        }
        // Only clear if we actually had a selection before and it's not a remount
        if (hadSelection) {
          // Clear selection if value is explicitly cleared (and we're not selecting)
          setSelectedSupplier(null);
          lastSelectedValueRef.current = null;
          prevSelectedSupplierRef.current = null;
        }
      }
    }
  }, [value, findSupplierByIdMemo, providersLoading, providers.length]);

  // Separate effect to sync prevSelectedSupplierRef when selectedSupplier changes
  useEffect(() => {
    prevSelectedSupplierRef.current = selectedSupplier;
  }, [selectedSupplier]);

  // Filter suppliers from shared list based on search term
  const filterSuppliers = useCallback(
    (search: string) => {
      if (!providers || providers.length === 0) {
        setSuppliers([]);
        return;
      }

      if (!search.trim()) {
        // Convert providers to suppliers format
        const suppliersList: Supplier[] = providers.map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          place: p.place,
        }));
        setSuppliers(suppliersList);
        return;
      }

      const searchLower = search.toLowerCase();
      const filtered = providers
        .filter(
          p =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.phone?.toLowerCase().includes(searchLower) ||
            p.place?.toLowerCase().includes(searchLower)
        )
        .map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          place: p.place,
        }));
      setSuppliers(filtered);
    },
    [providers]
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isOpen && !providersLoading) {
      searchTimeoutRef.current = setTimeout(() => {
        filterSuppliers(searchTerm);
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen, filterSuppliers, providersLoading]);

  // Initialize suppliers from shared list when providers are loaded
  useEffect(() => {
    if (!providersLoading && providers.length > 0) {
      filterSuppliers(searchTerm);
    } else if (!providersLoading && providers.length === 0) {
      setSuppliers([]);
    }
  }, [providersLoading, providers.length, filterSuppliers, searchTerm]);

  // Also populate suppliers when dropdown opens (in case providers loaded after mount)
  useEffect(() => {
    if (
      isOpen &&
      !providersLoading &&
      providers.length > 0 &&
      suppliers.length === 0
    ) {
      filterSuppliers(searchTerm);
    }
  }, [
    isOpen,
    providersLoading,
    providers.length,
    suppliers.length,
    filterSuppliers,
    searchTerm,
  ]);

  const handleSelect = (supplier: Supplier) => {
    // Mark that we're in the middle of a selection
    isSelectingRef.current = true;
    // Set selected supplier immediately for instant UI feedback (fast, non-blocking)
    setSelectedSupplier(supplier);
    // Track the selected value to prevent useEffect from clearing it
    lastSelectedValueRef.current = supplier.id;
    // Close dropdown immediately
    setIsOpen(false);
    setSearchTerm('');
    // Defer onChange to allow dropdown to close first
    setTimeout(() => {
      onChange(supplier.id);
    }, 0);
    // Clear the flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 200);
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Mark that we're clearing
    isSelectingRef.current = true;
    // Clear selection immediately for instant UI feedback
    setSelectedSupplier(null);
    // Clear the search term
    setSearchTerm('');
    // Track the cleared value
    lastSelectedValueRef.current = null;
    // Defer onChange to allow UI to update first
    setTimeout(() => {
      onChange(null);
    }, 0);
    // Clear the flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 200);
  };

  // Use suppliers directly (they're already filtered)
  // Don't use fallback - if search has no results, show empty list
  const filteredSuppliers = suppliers;

  const handleCreateProvider = async (providerData: { name: string; phone?: string; place?: string }) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось создать поставщика');
      }

      const newProvider = await response.json();

      // Reload providers list
      await reloadProviders();

      // Select the newly created provider (prefill the control)
      // Use requestAnimationFrame to ensure this happens after all other updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onChange(newProvider.id);
        });
      });
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
          disabled={disabled || isLoading}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">
              {selectedSupplier
                ? selectedSupplier.name ||
                  selectedSupplier.phone ||
                  'Поставщик'
                : placeholder}
            </span>
            {isLoading && (
              <span
                className="inline-flex h-4 w-4 flex-shrink-0 animate-spin items-center justify-center rounded-full border-2 border-purple-600 border-t-transparent bg-white dark:bg-gray-800"
                style={{
                  minWidth: '16px',
                  minHeight: '16px',
                }}
                role="status"
                aria-live="polite"
                aria-label="Сохранение..."
              />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {selectedSupplier && !disabled && !isLoading && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClear(e as any);
                  }
                }}
                className="cursor-pointer rounded p-0.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:hover:bg-gray-700"
                onMouseDown={e => e.stopPropagation()}
                title="Очистить поставщика"
                aria-label="Очистить поставщика"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </div>
            )}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="p-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Поиск по имени, телефону или месту..."
            className="mb-2"
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full mb-2"
            disabled={disabled || isLoading}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Создать поставщика
          </Button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">
              {providersLoading
                ? 'Загрузка...'
                : searchTerm
                  ? 'Поставщики не найдены'
                  : providers.length === 0
                    ? 'Нет доступных поставщиков'
                    : 'Начните вводить для поиска'}
            </div>
          ) : (
            <ul className="py-1">
              {filteredSuppliers.map(supplier => (
                <li key={supplier.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(supplier)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {supplier.name ||
                        supplier.phone ||
                        'Без имени'}
                    </div>
                    {supplier.phone && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.place && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {supplier.place}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
    {typeof window !== 'undefined' && createPortal(
      <CreateProviderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          // Isolate the close to prevent any side effects on parent modal
          requestAnimationFrame(() => {
            setIsCreateModalOpen(false);
          });
        }}
        onCreate={handleCreateProvider}
      />,
      document.body
    )}
    </>
  );
}

// Memoize SupplierSelector to prevent unnecessary re-renders
// Only re-render if value, onChange, or other props actually change
export const SupplierSelector = memo(
  SupplierSelectorComponent,
  (prevProps, nextProps) => {
    // Only re-render if value or other props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.onChange === nextProps.onChange &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);
