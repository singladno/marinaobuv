'use client';
import { Heart, Pencil, Hand } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useRef, memo } from 'react';

import CartActionButton from '@/components/product/CartActionButton';
import PurchaseIndexBadges from '@/components/features/PurchaseIndexBadges';
import RemoveColorChooser from '@/components/features/RemoveColorChooser';
import ColorSwitcher from '@/components/product/ColorSwitcher';
import NoImagePlaceholder from '@/components/product/NoImagePlaceholder';
import { ProductSourceModal } from '@/components/product/ProductSourceModal';
import { SourceMessagesModal } from '@/components/features/SourceMessagesModal';
import { EditProductModal } from '@/components/admin/EditProductModal';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@/contexts/NextAuthUserContext';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useAllCategories } from '@/hooks/useAllCategories';
import { cn } from '@/lib/utils';
import { rub } from '@/lib/format';

// Function to get relative time in Russian
function getRelativeTime(dateString: string): string {
  // Only calculate on client side to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return 'Проверяется...';
  }

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Только что';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} мин. назад`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ч. назад`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} дн. назад`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} мес. назад`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} г. назад`;
}

type Props = {
  slug: string;
  name: string;
  pricePair: number;
  // removed from DB; compute from sizes
  currency: string;
  imageUrl: string | null;
  videos?: Array<{ id: string; url: string; alt: string | null }>;
  category?: string;
  showCategory?: boolean;
  colorOptions?: Array<{ color: string; imageUrl: string }>;
  productId?: string; // Add productId for source button
  activeUpdatedAt?: string; // Add activeUpdatedAt for availability display
  source?: 'WA' | 'AG' | 'MANUAL'; // Product source: WA (WhatsApp), AG (aggregator), or MANUAL (manually created)
  isActive?: boolean; // Product active status
  onProductUpdated?: (updatedProduct?: any) => void; // Callback when product is updated
  priority?: boolean; // Image loading priority for LCP optimization
};

function ProductCard({
  slug,
  name,
  pricePair,
  // removed
  imageUrl,
  videos,
  category,
  showCategory = false,
  colorOptions = [],
  productId,
  activeUpdatedAt,
  source,
  isActive = true,
  onProductUpdated,
  priority = false,
}: Props) {
  const { user } = useUser();
  const { categories, loading: categoriesLoading } = useAllCategories();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManualSourceModalOpen, setIsManualSourceModalOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [loadingProductData, setLoadingProductData] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [optimisticIsActive, setOptimisticIsActive] = useState(isActive);
  const [isEditingSortIndex, setIsEditingSortIndex] = useState(false);
  const [editSortIndexValue, setEditSortIndexValue] = useState('');
  const sortIndexInputRef = useRef<HTMLInputElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Sync optimistic state with prop when it changes externally
  useEffect(() => {
    setOptimisticIsActive(isActive);
  }, [isActive]);
  const {
    isPurchaseMode,
    activePurchase,
    setActivePurchase,
    selectedProductIds,
    addProductToPurchase,
    removeProductFromPurchase,
    refreshPurchases,
    updateActivePurchaseItems,
  } = usePurchase();
  useEffect(() => {
    if (!selectedColor && colorOptions.length > 0) {
      setSelectedColor(colorOptions[0]?.color ?? null);
    }
  }, [selectedColor, colorOptions]);
  const hasVideo = videos && videos.length > 0;
  const firstVideo = hasVideo ? videos[0] : null;

  const displayImageUrl = useMemo(() => {
    const effectiveColor = selectedColor || (colorOptions[0]?.color ?? null);
    if (effectiveColor) {
      const found = colorOptions.find(
        o => o.color?.toLowerCase() === effectiveColor.toLowerCase()
      );
      if (found?.imageUrl) return found.imageUrl;
    }
    return imageUrl || null;
  }, [selectedColor, colorOptions, imageUrl]);
  const hasImage = displayImageUrl && displayImageUrl.trim() !== '';
  const computedPairPrice = useMemo(() => pricePair ?? null, [pricePair]);

  // Purchase mode logic
  const isInPurchase = productId ? selectedProductIds.has(productId) : false;
  const productItems = useMemo(
    () =>
      (activePurchase?.items || []).filter(
        item => item.productId === (productId || '')
      ),
    [activePurchase?.items, productId]
  );
  const addedColors = useMemo(
    () => productItems.map(i => i.color).filter(Boolean) as string[],
    [productItems]
  );
  const hasMultipleColorsInPurchase = productItems.length > 1;
  const purchaseSortIndex = productItems[0]?.sortIndex;
  const [showRemoveChooser, setShowRemoveChooser] = useState(false);

  const handlePurchaseClick = async (e: React.MouseEvent) => {
    if (!isPurchaseMode || !productId || !activePurchase || isProcessing) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Set loading state immediately for optimistic UI
    setIsProcessing(true);
    setIsAdding(!isInPurchase);

    try {
      if (isInPurchase) {
        // If multiple colors exist in purchase, show chooser
        if (hasMultipleColorsInPurchase) {
          setShowRemoveChooser(true);
          return;
        }
        // Single item: remove that color
        const onlyItem = productItems[0];
        await removeProductFromPurchase(productId, onlyItem?.color ?? null);
      } else {
        await addProductToPurchase(productId, selectedColor || null);
      }
    } catch (error) {
      // Error is already handled in the context functions
      // The error is already handled in the context functions
      // The optimistic UI will be reverted automatically since the state wasn't updated
    } finally {
      // Remove loading state after operation completes
      setIsProcessing(false);
      setIsAdding(false);
    }
  };

  const handleSortIndexClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (purchaseSortIndex) {
      setEditSortIndexValue(purchaseSortIndex.toString());
      setIsEditingSortIndex(true);
    }
  };

  const handleSortIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setEditSortIndexValue(value);
    }
  };

  const handleSortIndexSubmit = async () => {
    if (!editSortIndexValue || !activePurchase || !productId) return;

    const newIndex = parseInt(editSortIndexValue);
    if (newIndex <= 0) return;

    setIsProcessing(true);
    try {
      // Find the purchase item
      const purchaseItem = activePurchase.items.find(
        item => item.productId === productId
      );
      if (!purchaseItem) return;

      // Update the single item's sort index
      const response = await fetch(
        `/api/admin/purchases/${activePurchase.id}/items/${purchaseItem.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sortIndex: newIndex,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update sort index');
      }

      const updatedItem = await response.json();

      // Update local state immediately (same as purchase detail page)
      const updatedItems = activePurchase.items.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );

      // Handle position insertion - if new index conflicts, shift other items
      const recalculatedItems = [...updatedItems];

      // Find the item we're updating
      const targetItem = recalculatedItems.find(
        item => item.id === updatedItem.id
      );
      if (targetItem) {
        // Remove the target item temporarily
        const otherItems = recalculatedItems.filter(
          item => item.id !== targetItem.id
        );

        // Insert the target item at the desired position
        otherItems.splice(newIndex - 1, 0, targetItem);

        // Reassign sequential indexes
        otherItems.forEach((item, index) => {
          item.sortIndex = index + 1;
        });

        // Update the recalculated items
        recalculatedItems.length = 0;
        recalculatedItems.push(...otherItems);
      }

      // Update the active purchase items immediately for UI
      updateActivePurchaseItems(recalculatedItems);

      // Update indexes in database asynchronously (same as purchase detail page)
      const updatePromises = recalculatedItems.map(item =>
        fetch(`/api/admin/purchases/${activePurchase.id}/items/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sortIndex: item.sortIndex,
          }),
        })
      );

      // Don't await this - let it run in background
      Promise.all(updatePromises).catch(() => {
        // Silently handle errors - updates are non-critical
      });
    } catch {
      // Error is already handled in the context functions
    } finally {
      setIsProcessing(false);
      setIsEditingSortIndex(false);
    }
  };

  const handleSortIndexCancel = () => {
    setIsEditingSortIndex(false);
    setEditSortIndexValue('');
  };

  const handleSortIndexKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSortIndexSubmit();
    } else if (e.key === 'Escape') {
      handleSortIndexCancel();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingSortIndex && sortIndexInputRef.current) {
      sortIndexInputRef.current.focus();
      sortIndexInputRef.current.select();
    }
  }, [isEditingSortIndex]);

  const handleToggleActive = async (checked: boolean) => {
    if (!productId || isTogglingActive) return;

    // Optimistic update - update UI immediately
    const previousValue = optimisticIsActive;
    setOptimisticIsActive(checked);
    setIsTogglingActive(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId,
          isActive: checked,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Success - optimistic update was correct, no need to refetch
      // The prop will update on next page load/navigation
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticIsActive(previousValue);
    } finally {
      setIsTogglingActive(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isInactive = !optimisticIsActive;

  return (
    <>
      <div
        data-product-id={productId}
        className={`bg-surface rounded-card-large shadow-card hover:shadow-card-hover group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
          isPurchaseMode && (isInPurchase || isProcessing)
            ? 'bg-purple-50 ring-2 ring-purple-500'
            : ''
        } ${isAdmin && isInactive ? 'opacity-60 grayscale' : ''}`}
      >
        {/* Processing Loader Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
              <span className="text-xs font-medium text-purple-600">
                {isAdding ? 'Добавление...' : 'Удаление...'}
              </span>
            </div>
          </div>
        )}

        {/* Heart overlay outside the Link to avoid navigation */}
        <button
          type="button"
          aria-label="Добавить в избранное"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(slug);
          }}
          className="absolute right-3 top-3 z-10 inline-flex cursor-pointer items-center justify-center text-white transition-transform hover:scale-110"
        >
          <Heart
            className={`h-5 w-5 ${isFavorite(slug) ? 'fill-red-500 text-white' : 'fill-purple-500/20 text-white'}`}
          />
        </button>

        {/* Purchase Mode Indicators */}
        {isPurchaseMode && (
          <>
            {/* Purchase Sort Index Badges (per color) */}
            {isInPurchase && productItems.length > 0 && (
              <PurchaseIndexBadges
                items={productItems}
                onSubmitIndex={async (itemId, newIndex) => {
                  if (!activePurchase) return;
                  // Update server for this item
                  const response = await fetch(
                    `/api/admin/purchases/${activePurchase.id}/items/${itemId}`,
                    {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sortIndex: newIndex }),
                    }
                  );
                  if (!response.ok) return;
                  const updatedItem = await response.json();
                  const updatedItems = (activePurchase.items || []).map(i =>
                    i.id === updatedItem.id ? updatedItem : i
                  );
                  // Locally re-sequence for visual consistency
                  const recalculated = [...updatedItems]
                    .sort((a, b) => a.sortIndex - b.sortIndex)
                    .map((it, idx) => ({ ...it, sortIndex: idx + 1 }));
                  updateActivePurchaseItems(recalculated);
                }}
              />
            )}

            {/* Purchase Mode Overlay */}
            <div
              className={`absolute inset-0 z-20 cursor-pointer ${isEditingSortIndex ? 'pointer-events-none' : ''}`}
              onClick={handlePurchaseClick}
              title={isInPurchase ? 'Убрать из закупки' : 'Добавить в закупку'}
            />
          </>
        )}

        <Link
          href={
            isPurchaseMode
              ? '#'
              : {
                  pathname: `/product/${slug}`,
                  query:
                    selectedColor || null
                      ? { color: selectedColor as string }
                      : undefined,
                }
          }
          className="block flex-1"
          onClick={e => {
            if (isPurchaseMode) {
              e.preventDefault();
              return;
            }
            // Store referrer and product ID for scroll-to-product feature
            if (typeof window !== 'undefined' && productId) {
              const referrer = window.location.href;
              sessionStorage.setItem(
                'productNavigation',
                JSON.stringify({
                  productId,
                  referrer,
                  timestamp: Date.now(),
                })
              );
            }
          }}
        >
          {/* Media Container (Image or Video) */}
          <div className="bg-muted group/image relative aspect-square w-full overflow-hidden">
            {hasVideo && firstVideo ? (
              <video
                src={firstVideo.url}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                muted
                loop
                playsInline
                preload="metadata"
                poster={displayImageUrl || undefined}
                aria-label={firstVideo.alt || name}
              />
            ) : hasImage ? (
              <Image
                src={displayImageUrl as string}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority={priority}
              />
            ) : (
              <NoImagePlaceholder />
            )}

            {/* Video play indicator */}
            {hasVideo && (
              <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                <svg
                  className="inline-block h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            )}

            {/* Category Badge */}
            {showCategory && category && !isPurchaseMode && (
              <Badge
                variant="secondary"
                className="bg-background/90 absolute left-3 top-3 shadow-sm backdrop-blur-sm"
              >
                {category}
              </Badge>
            )}

            {/* Admin Controls - always visible on mobile/tablet/iPad, hover on desktop (admin only) - hidden in purchase mode */}
            {isAdmin && productId && !isPurchaseMode && (
              <>
                {/* Source Button - left side */}
                {source && (
                  <>
                    {source === 'MANUAL' ? (
                      <button
                        type="button"
                        onClick={async e => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (productId) {
                            setIsManualSourceModalOpen(true);
                            // Fetch product data when opening modal (always fetch to get latest data)
                            setLoadingProductData(true);
                            try {
                              const response = await fetch(
                                `/api/admin/products/${productId}`
                              );
                              if (response.ok) {
                                const data = await response.json();
                                setProductData(data.product);
                              }
                            } catch (error) {
                            } finally {
                              setLoadingProductData(false);
                            }
                          }
                        }}
                        className="group/manual-icon source-icon-hover-toggle absolute relative left-2 top-2 z-20 flex h-9 w-9 cursor-pointer items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none"
                        title="Просмотреть исходное сообщение"
                      >
                        <Hand
                          className="h-5 w-5 fill-purple-500/20 text-white"
                          strokeWidth={1.5}
                        />
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 opacity-0 shadow-xl transition-opacity duration-200 group-hover/manual-icon:block group-hover/manual-icon:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          Товар добавлен вручную
                          <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"></div>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsSourceModalOpen(true);
                        }}
                        className="source-icon-hover-toggle absolute left-2 top-2 z-20 cursor-pointer transition-all duration-200 focus:outline-none"
                        title="Просмотр источника сообщений"
                      >
                        {source === 'WA' ? (
                          <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                            <Image
                              src="/images/whatsapp-icon.png"
                              alt="WhatsApp"
                              width={36}
                              height={36}
                              className="h-full w-full rounded"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer border-0 bg-purple-500/80 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-purple-600/80"
                          >
                            Источник
                          </Badge>
                        )}
                      </button>
                    )}
                  </>
                )}

                {/* Edit Button - right side, below heart icon, horizontally aligned with like icon */}
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  className="source-icon-hover-toggle absolute right-3 top-12 z-20 inline-flex cursor-pointer items-center justify-center text-white transition-all duration-200 hover:scale-110 focus:outline-none"
                  title="Редактировать товар"
                >
                  <Pencil className="h-5 w-5 fill-purple-500/20 text-white" />
                </button>
              </>
            )}

            {/* Hover Overlay (visual only, allow right-click on image) */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
          </div>

          <div className="space-y-3 p-5">
            <Text
              variant="body"
              className="text-foreground group-hover:text-primary line-clamp-2 min-h-[2.5rem] font-medium leading-tight transition-colors duration-200"
            >
              {name}
            </Text>
            <div className="flex items-center justify-between">
              <Text className="text-foreground text-xl font-bold">
                {rub(computedPairPrice ?? 0)}
              </Text>
              <CartActionButton
                slug={slug}
                productName={name}
                productImageUrl={displayImageUrl || undefined}
                color={selectedColor || colorOptions[0]?.color || null}
              />
            </div>
            <div className="relative z-30">
              <ColorSwitcher
                options={colorOptions}
                selectedColor={selectedColor || colorOptions[0]?.color || null}
                onSelect={setSelectedColor}
                addedColors={isInPurchase ? addedColors : []}
                showAddIndicators={isInPurchase}
                onAddColor={async color => {
                  if (!productId) return;
                  setIsProcessing(true);
                  setIsAdding(true);
                  try {
                    await addProductToPurchase(productId, color);
                  } finally {
                    setIsProcessing(false);
                    setIsAdding(false);
                  }
                }}
              />
            </div>
          </div>
        </Link>

        {/* Availability info - positioned at the very bottom of the card */}
        {activeUpdatedAt && (
          <div className="px-5 pb-3 text-xs text-gray-500">
            Наличие проверено: {getRelativeTime(activeUpdatedAt)}
          </div>
        )}

        {/* Active/Inactive Power Button - TV style, bottom right of card - aligned with cart button */}
        {isAdmin && productId && !isPurchaseMode && (
          <div className="source-icon-hover-toggle absolute bottom-3 right-5 z-20">
            {isTogglingActive ? (
              <div className="flex h-7 w-7 items-center justify-center">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              </div>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleActive(!optimisticIsActive);
                }}
                disabled={isTogglingActive}
                className={cn(
                  'group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
                  // TV button 3D effect with inset shadow
                  optimisticIsActive
                    ? 'border border-purple-400/30 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(147,51,234,0.4)]'
                    : 'border border-gray-300/50 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)] dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-800 dark:text-gray-400'
                )}
                title={
                  optimisticIsActive
                    ? 'Деактивировать товар'
                    : 'Активировать товар'
                }
              >
                {/* Power symbol - TV style */}
                <svg
                  className={cn(
                    'h-3.5 w-3.5 transition-all duration-200',
                    optimisticIsActive ? 'drop-shadow-sm' : ''
                  )}
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path
                    d="M312.264,51.852v46.714c76.614,23.931,132.22,95.441,132.22,179.94  c0,104.097-84.387,188.484-188.484,188.484l-22.505,22.505L256,512c128.955,0,233.495-104.539,233.495-233.495  C489.495,168.95,414.037,77.034,312.264,51.852z"
                    fill="currentColor"
                  />
                  <g>
                    <path
                      d="M67.516,278.505c0-84.499,55.605-156.009,132.22-179.94V51.852   C97.963,77.034,22.505,168.95,22.505,278.505C22.505,407.461,127.045,512,256,512v-45.011   C151.903,466.989,67.516,382.602,67.516,278.505z"
                      fill="currentColor"
                    />
                    <rect
                      x="233.495"
                      width="45.011"
                      height="278.505"
                      fill="currentColor"
                    />
                  </g>
                </svg>
              </button>
            )}
          </div>
        )}
        {isPurchaseMode && showRemoveChooser && productItems.length > 1 && (
          <RemoveColorChooser
            items={productItems}
            onChoose={async itemId => {
              setIsProcessing(true);
              try {
                // Find item and remove by id using existing API
                const item = productItems.find(i => i.id === itemId);
                if (!item || !activePurchase) return;
                await fetch(
                  `/api/admin/purchases/${activePurchase.id}/items/${item.id}`,
                  { method: 'DELETE' }
                );
                // Update local state
                updateActivePurchaseItems(
                  (activePurchase.items || []).filter(i => i.id !== item.id)
                );
              } finally {
                setIsProcessing(false);
                setIsAdding(false);
                setShowRemoveChooser(false);
              }
            }}
            onCancel={() => setShowRemoveChooser(false)}
          />
        )}
      </div>

      {/* Source Modal - rendered outside card to avoid clipping (admin only) */}
      {isAdmin && productId && (
        <>
          <ProductSourceModal
            isOpen={isSourceModalOpen}
            onClose={() => setIsSourceModalOpen(false)}
            productId={productId}
            productName={name}
          />
          {/* Manual Source Modal - same as admin table */}
          {isManualSourceModalOpen && (
            <>
              {loadingProductData || !productData ? (
                <Modal
                  isOpen={true}
                  onClose={() => {
                    setIsManualSourceModalOpen(false);
                    setProductData(null);
                  }}
                  title="Загрузка..."
                  size="xl"
                >
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                  </div>
                </Modal>
              ) : (
                <SourceMessagesModal
                  isOpen={isManualSourceModalOpen}
                  onClose={() => {
                    setIsManualSourceModalOpen(false);
                    setProductData(null);
                  }}
                  product={productData}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Edit Modal - rendered outside card to avoid clipping (admin only) */}
      {/* Only render when modal is actually open to prevent unnecessary data fetching */}
      {isAdmin && productId && isEditModalOpen && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          productId={productId}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onProductUpdated={updatedProduct => {
            // Pass through to parent without any side effects
            onProductUpdated?.(updatedProduct);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}

export default memo(ProductCard);
