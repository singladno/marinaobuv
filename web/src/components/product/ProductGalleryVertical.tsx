'use client';

import { ChevronLeft, ChevronRight, Pencil, Hand } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUser } from '@/contexts/NextAuthUserContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { EditProductModal } from '@/components/admin/EditProductModal';
import { ProductSourceModal } from './ProductSourceModal';
import { UnavailableProductOverlay } from './UnavailableProductOverlay';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
  height?: number; // px height for main image container
  productId?: string;
  sourceMessageIds?: string[] | null;
  isActive: boolean;
  source?: 'WA' | 'AG' | 'MANUAL';
}

export default function ProductGalleryVertical({
  images,
  productName,
  height = 560,
  productId,
  sourceMessageIds,
  isActive,
  source,
}: ProductGalleryProps) {
  const { user } = useUser();
  const { categories, loading: categoriesLoading } = useCategories();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [optimisticIsActive, setOptimisticIsActive] = useState(isActive);
  const swiperRef = useRef<SwiperType | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  // Sync optimistic state with prop when it changes externally
  useEffect(() => {
    setOptimisticIsActive(isActive);
  }, [isActive]);

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
  const safeImages =
    images?.length > 0
      ? images
      : [{ url: '/images/demo/1.jpg', alt: productName }];

  // Ensure currentIndex is always valid when images change
  useEffect(() => {
    if (currentIndex > safeImages.length - 1) {
      setCurrentIndex(0);
    }
  }, [safeImages.length, currentIndex]);

  const clampedIndex = Math.min(
    currentIndex,
    Math.max(0, safeImages.length - 1)
  );

  const goToSlide = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex(prev => (prev === 0 ? safeImages.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex(prev => (prev === safeImages.length - 1 ? 0 : prev + 1));

  // Mobile/iPad Swiper component - same layout as desktop but with Swiper
  const MobileSwiper = () => (
    <div className="flex gap-4 xl:hidden">
      {/* Left thumbnails */}
      <div className="flex w-20 shrink-0 flex-col gap-2 overflow-y-auto">
        {safeImages.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              if (swiperRef.current) {
                swiperRef.current.slideTo(index);
              }
            }}
            title={`Показать фото ${index + 1}`}
            aria-label={`Показать фото ${index + 1}`}
            className={`relative aspect-square overflow-hidden rounded-md border transition-colors ${
              index === currentIndex
                ? 'border-purple-600 ring-1 ring-purple-600'
                : 'border-muted hover:border-purple-500'
            }`}
          >
            <div className="relative h-full w-full">
              <Image
                src={image.url}
                alt={image.alt || productName}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Main image block with Swiper */}
      <Card className="group relative flex-1 min-w-0 overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <div
          className="product-gallery-main relative w-full max-w-full overflow-hidden"
          style={{ '--gallery-height': `${height}px` } as React.CSSProperties}
        >
          <div className="h-full w-full max-w-full">
            <Swiper
              modules={[Navigation]}
              spaceBetween={0}
              slidesPerView={1}
              navigation={{
                nextEl: '.product-swiper-button-next',
                prevEl: '.product-swiper-button-prev',
              }}
              onSlideChange={swiper => setCurrentIndex(swiper.activeIndex)}
              onSwiper={swiper => {
                swiperRef.current = swiper;
              }}
              className="h-full w-full max-w-full"
              initialSlide={currentIndex}
            >
              {safeImages.map((image, index) => (
                <SwiperSlide key={index} className="!w-full">
                  <div className="relative h-full w-full max-w-full">
                    <Image
                      src={image.url}
                      alt={image.alt || productName}
                      fill
                      sizes="(max-width: 768px) 100vw, 640px"
                      className="object-contain max-w-full"
                      priority={index === 0}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Unavailable overlay */}
          {!optimisticIsActive && <UnavailableProductOverlay />}

          {/* Admin controls - Source and Edit icons */}
          {isAdmin && productId && (
            <div className="absolute left-2 top-2 z-20 flex gap-2">
              {/* Source indicator */}
              {source && (
                <>
                  {source === 'MANUAL' ? (
                    <div className="group/manual-icon relative source-icon-hover-toggle flex h-12 w-12 items-center justify-center transition-all duration-200">
                      <Hand className="h-5 w-5 text-white fill-purple-500/20" strokeWidth={1.5} />
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 hidden rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 opacity-0 shadow-xl transition-opacity duration-200 group-hover/manual-icon:block group-hover/manual-icon:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 pointer-events-none whitespace-nowrap z-50">
                        Товар добавлен вручную
                        <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 border-l border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"></div>
                      </div>
                    </div>
                  ) : sourceMessageIds && sourceMessageIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(true)}
                  className="source-icon-hover-toggle transition-all duration-200 focus:outline-none"
                  title="Просмотр источника сообщений"
                >
                  {source === 'WA' ? (
                    <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                      <Image
                        src="/images/whatsapp-icon.png"
                        alt="WhatsApp"
                        width={48}
                        height={48}
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
                  ) : null}
                </>
              )}

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="source-icon-hover-toggle inline-flex cursor-pointer items-center justify-center text-white transition-all duration-200 hover:scale-110 focus:outline-none"
                title="Редактировать товар"
              >
                <Pencil className="h-5 w-5 text-white fill-purple-500/20" />
              </button>
            </div>
          )}

          {/* Navigation buttons - hidden on mobile only, visible on iPad */}
          {safeImages.length > 1 && (
            <>
              <button
                className="product-swiper-button-prev absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition-all hover:bg-white focus:outline-none md:flex"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="product-swiper-button-next absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition-all hover:bg-white focus:outline-none md:flex"
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Active/Inactive Power Button - TV style, bottom right of image block */}
        {isAdmin && productId && (
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
      </Card>
    </div>
  );

  // Desktop layout with thumbnails (large screens only)
  const DesktopLayout = () => (
    <div className="mx-auto hidden gap-4 xl:flex">
      {/* Left thumbnails */}
      <div className="flex w-20 shrink-0 flex-col gap-2 overflow-y-auto">
        {safeImages.map((image, index) => (
          <button
            key={index}
            onMouseEnter={() => goToSlide(index)}
            onFocus={() => goToSlide(index)}
            title={`Показать фото ${index + 1}`}
            aria-label={`Показать фото ${index + 1}`}
            className={`relative aspect-square overflow-hidden rounded-md border transition-colors ${
              index === currentIndex
                ? 'border-purple-600 ring-1 ring-purple-600'
                : 'border-muted hover:border-purple-500'
            }`}
          >
            <div className="relative h-full w-full">
              <Image
                src={image.url}
                alt={image.alt || productName}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Main image block */}
      <Card className="group relative flex-1 overflow-hidden rounded-xl shadow-sm">
        <div
          className="product-gallery-main relative w-full"
          style={{ '--gallery-height': `${height}px` } as React.CSSProperties}
        >
          <Image
            src={safeImages[clampedIndex]?.url || '/images/demo/1.jpg'}
            alt={safeImages[clampedIndex]?.alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain"
            priority
          />
          {!optimisticIsActive && <UnavailableProductOverlay />}
        </div>

        {/* Admin controls - Source and Edit icons */}
        {isAdmin && productId && (
          <div className="absolute left-2 top-2 z-20 flex gap-2">
            {/* Source indicator */}
            {sourceMessageIds && sourceMessageIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
                className="source-icon-hover-toggle transition-all duration-200 focus:outline-none"
                title="Просмотр источника сообщений"
              >
                {source === 'WA' ? (
                  <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                    <Image
                      src="/images/whatsapp-icon.png"
                      alt="WhatsApp"
                      width={48}
                      height={48}
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

            {/* Edit button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="source-icon-hover-toggle inline-flex cursor-pointer items-center justify-center text-white transition-all duration-200 hover:scale-110 focus:outline-none"
              title="Редактировать товар"
            >
              <Pencil className="h-5 w-5 text-white fill-purple-500/20" />
            </button>
          </div>
        )}

        {/* Active/Inactive Power Button - TV style, bottom right of image block */}
        {isAdmin && productId && (
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

        {safeImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              onClick={goToPrevious}
              title="Предыдущее фото"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              onClick={goToNext}
              title="Следующее фото"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </Card>
    </div>
  );

  return (
    <>
      <MobileSwiper />
      <DesktopLayout />
      {isAdmin && productId && (
        <>
          <ProductSourceModal
            isOpen={isSourceModalOpen}
            onClose={() => setIsSourceModalOpen(false)}
            productId={productId}
            productName={productName}
          />
          {isEditModalOpen && (
            <EditProductModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              productId={productId}
              categories={categories}
              categoriesLoading={categoriesLoading}
              onProductUpdated={() => {
                setIsEditModalOpen(false);
                // Reload the page to show updated product data
                window.location.reload();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
