'use client';

import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
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

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
  height?: number; // px height for main image container
  productId?: string;
  sourceMessageIds?: string[] | null;
  isActive: boolean;
  source?: 'WA' | 'AG';
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
  const { categories } = useCategories();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const isAdmin = user?.role === 'ADMIN';
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
          {!isActive && <UnavailableProductOverlay />}

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
                <Pencil className="h-5 w-5 text-white" />
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
          {!isActive && <UnavailableProductOverlay />}
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
              <Pencil className="h-5 w-5 text-white" />
            </button>
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
