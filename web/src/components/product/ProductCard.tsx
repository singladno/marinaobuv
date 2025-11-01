'use client';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useRef } from 'react';

import CartActionButton from '@/components/product/CartActionButton';
import PurchaseIndexBadges from '@/components/features/PurchaseIndexBadges';
import RemoveColorChooser from '@/components/features/RemoveColorChooser';
import ColorSwitcher from '@/components/product/ColorSwitcher';
import NoImagePlaceholder from '@/components/product/NoImagePlaceholder';
import { ProductSourceModal } from '@/components/product/ProductSourceModal';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@/contexts/NextAuthUserContext';
import { usePurchase } from '@/contexts/PurchaseContext';
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
  category?: string;
  showCategory?: boolean;
  colorOptions?: Array<{ color: string; imageUrl: string }>;
  productId?: string; // Add productId for source button
  activeUpdatedAt?: string; // Add activeUpdatedAt for availability display
  source?: 'WA' | 'AG'; // Product source: WA (WhatsApp) or AG (aggregator)
};

export default function ProductCard({
  slug,
  name,
  pricePair,
  // removed
  imageUrl,
  category,
  showCategory = false,
  colorOptions = [],
  productId,
  activeUpdatedAt,
  source,
}: Props) {
  const { user } = useUser();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isEditingSortIndex, setIsEditingSortIndex] = useState(false);
  const [editSortIndexValue, setEditSortIndexValue] = useState('');
  const sortIndexInputRef = useRef<HTMLInputElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
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

  // Debug logging for sort index
  useEffect(() => {
    if (isInPurchase && purchaseSortIndex) {
      console.log(
        '🔍 Current sort index for product:',
        productId,
        'is:',
        purchaseSortIndex
      );
    }
  }, [isInPurchase, purchaseSortIndex, productId]);

  const handlePurchaseClick = async (e: React.MouseEvent) => {
    console.log('🖱️ Purchase click triggered:', {
      isPurchaseMode,
      productId,
      activePurchase: activePurchase?.id,
      isInPurchase,
    });

    if (!isPurchaseMode || !productId || !activePurchase || isProcessing) {
      console.log('❌ Purchase click blocked:', {
        isPurchaseMode,
        productId,
        activePurchase: activePurchase?.id,
        isProcessing,
      });
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Set loading state immediately for optimistic UI
    setIsProcessing(true);

    try {
      if (isInPurchase) {
        // If multiple colors exist in purchase, show chooser
        if (hasMultipleColorsInPurchase) {
          setShowRemoveChooser(true);
          return;
        }
        // Single item: remove that color
        const onlyItem = productItems[0];
        console.log(
          '🗑️ Removing product from purchase:',
          productId,
          onlyItem?.color
        );
        await removeProductFromPurchase(productId, onlyItem?.color ?? null);
      } else {
        console.log('➕ Adding product to purchase:', productId, selectedColor);
        await addProductToPurchase(productId, selectedColor || null);
      }
    } catch (error) {
      console.error('❌ Purchase operation failed:', error);
      // The error is already handled in the context functions
      // The optimistic UI will be reverted automatically since the state wasn't updated
    } finally {
      // Remove loading state after operation completes
      setIsProcessing(false);
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
      Promise.all(updatePromises).catch(err =>
        console.error('Failed to update item indexes:', err)
      );

      console.log('✅ Sort index updated successfully');
    } catch (error) {
      console.error('Error updating sort index:', error);
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

  return (
    <>
      <div
        data-product-id={productId}
        className={`bg-surface rounded-card-large shadow-card hover:shadow-card-hover group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
          isPurchaseMode && (isInPurchase || isProcessing)
            ? 'bg-purple-50 ring-2 ring-purple-500'
            : ''
        }`}
      >
        {/* Processing Loader Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
              <span className="text-xs font-medium text-purple-600">
                {isInPurchase ? 'Удаление...' : 'Добавление...'}
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
            className={`h-5 w-5 ${isFavorite(slug) ? 'fill-red-500 text-red-500' : ''}`}
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
              sessionStorage.setItem('productNavigation', JSON.stringify({
                productId,
                referrer,
                timestamp: Date.now(),
              }));
            }
          }}
        >
          {/* Image Container */}
          <div className="bg-muted group/image relative aspect-square w-full overflow-hidden">
            {hasImage ? (
              <Image
                src={displayImageUrl as string}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority={false}
              />
            ) : (
              <NoImagePlaceholder />
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

            {/* Source Chip - always visible on mobile/tablet/iPad, hover on desktop (admin only) - hidden in purchase mode */}
            {user?.role === 'ADMIN' && productId && !isPurchaseMode && (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSourceModalOpen(true);
                }}
                className="source-icon-hover-toggle absolute left-2 top-2 z-20 transition-all duration-200 focus:outline-none"
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

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
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
                  try {
                    await addProductToPurchase(productId, color);
                  } finally {
                    setIsProcessing(false);
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
                setShowRemoveChooser(false);
              }
            }}
            onCancel={() => setShowRemoveChooser(false)}
          />
        )}
      </div>

      {/* Source Modal - rendered outside card to avoid clipping (admin only) */}
      {user?.role === 'ADMIN' && productId && (
        <ProductSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          productId={productId}
          productName={name}
        />
      )}
    </>
  );
}
