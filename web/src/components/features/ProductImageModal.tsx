'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { ImageModalBadges } from '@/components/ui/ImageModalBadges';
import { ImageModalThumbnails } from '@/components/ui/ImageModalThumbnails';
import { Modal } from '@/components/ui/Modal';
import type { ProductImage } from '@/types/product';

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ProductImage[];
  productName: string;
  initialIndex?: number;
}

export function ProductImageModal({
  isOpen,
  onClose,
  images,
  productName,
  initialIndex = 0,
}: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const swiperRef = useRef<SwiperType | null>(null);

  // Filter out any null/undefined images and ensure we have valid image objects
  const validImages = React.useMemo(
    () => {
      if (!images || !Array.isArray(images)) {
        console.warn('ProductImageModal - Invalid images prop:', images);
        return [];
      }
      const filtered = images.filter((img, index) => {
        // Check if image has a valid URL (required)
        // ID can be generated if missing
        const hasUrl = img && typeof img === 'object' && img.url && typeof img.url === 'string' && img.url.trim() !== '';
        if (!hasUrl) {
          console.warn('ProductImageModal - Invalid image object (missing URL):', img);
        }
        return hasUrl;
      }).map((img, index) => ({
        // Ensure all images have an id, generate one if missing
        id: img.id || `image-${index}`,
        url: img.url,
        alt: img.alt || null,
      }));

      console.log('ProductImageModal - Processing images:', {
        original: images.length,
        filtered: filtered.length,
        sample: filtered[0]
      });
      if (filtered.length === 0 && images.length > 0) {
        console.error('ProductImageModal - All images filtered out. Original images:', images);
      }
      return filtered;
    },
    [images]
  );

  React.useEffect(() => {
    if (isOpen && validImages.length > 0) {
      const safeIndex = Math.max(0, Math.min(initialIndex, validImages.length - 1));
      setCurrentIndex(safeIndex);
      if (swiperRef.current) {
        swiperRef.current.slideTo(safeIndex);
      }
    }
  }, [isOpen, validImages.length, initialIndex]);

  const handleSlideChange = React.useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.activeIndex);
  }, []);

  if (!isOpen) return null;

  if (validImages.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Изображения товара: ${productName}`}
        size="xl"
        className="!max-w-none"
      >
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-gray-500">Нет изображений для отображения</p>
        </div>
      </Modal>
    );
  }

  const currentImage = validImages[currentIndex];
  const safeCurrentIndex = Math.max(
    0,
    Math.min(currentIndex, validImages.length - 1)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Изображения товара: ${productName}`}
      size="xl"
      className="!max-w-[95vw] md:!max-w-[90vw] lg:!max-w-5xl"
    >
      <div className="relative flex flex-col min-h-0 max-h-[calc(90vh-120px)] w-full">
        {/* Swiper carousel - fixed height to prevent overlap with thumbnails */}
        <div className="relative mb-4 flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 w-full" style={{ height: '350px', maxHeight: '350px', minHeight: '350px', overflow: 'hidden', position: 'relative' }}>
          <Swiper
            modules={[Navigation, Pagination, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            loop={false}
            navigation={{
              nextEl: '.product-image-modal-button-next',
              prevEl: '.product-image-modal-button-prev',
            }}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active',
              dynamicBullets: true,
            }}
            effect="fade"
            fadeEffect={{
              crossFade: true,
            }}
            speed={300}
            initialSlide={safeCurrentIndex}
            onSwiper={swiper => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            className="!h-full !w-full max-w-full"
          >
            {validImages.map((image, index) => (
              <SwiperSlide key={image.id || index} className="!flex !items-center !justify-center">
                <div className="relative h-full w-full">
                  <Image
                    src={image.url}
                    alt={image.alt || `${productName} - ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    priority={index === safeCurrentIndex}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          {validImages.length > 1 && (
            <>
              <button
                className="product-image-modal-button-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-opacity hover:bg-white disabled:opacity-30"
                aria-label="Previous image"
              >
                <svg
                  className="h-6 w-6 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                className="product-image-modal-button-next absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-opacity hover:bg-white disabled:opacity-30"
                aria-label="Next image"
              >
                <svg
                  className="h-6 w-6 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Badges */}
          <ImageModalBadges
            currentImage={{
              color: null,
            }}
            currentIndex={safeCurrentIndex}
            totalImages={validImages.length}
          />
        </div>

        {/* Thumbnail strip - fixed at bottom */}
        <div className="flex-shrink-0 w-full overflow-x-auto">
          <ImageModalThumbnails
            images={validImages.map(img => ({
              id: img.id,
              url: img.url,
              alt: img.alt || null,
              color: null,
              isActive: true,
            }))}
            currentIndex={safeCurrentIndex}
            selectedImages={new Set()}
            onImageSelect={setCurrentIndex}
            onToggleSelection={() => {}}
          />
        </div>
      </div>
    </Modal>
  );
}
