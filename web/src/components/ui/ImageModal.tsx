import * as React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { useImageModalKeyboard } from '@/hooks/useImageModalKeyboard';
import { useImageSelection } from '@/hooks/useImageSelection';

import { ImageModalBadges } from './ImageModalBadges';
import { ImageModalHeader } from './ImageModalHeader';
import { ImageModalThumbnails } from './ImageModalThumbnails';
import { Modal } from './Modal';

interface ImageModalProps {
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    color?: string | null;
    isActive?: boolean;
  }>;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  onImageToggle?: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  onBulkDelete?: (imageIds: string[]) => Promise<void>;
  onBulkSplit?: (imageIds: string[]) => Promise<void>;
  isUpdating?: string | null;
}

export function ImageModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  onImageToggle,
  onBulkDelete,
  onBulkSplit,
  isUpdating,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const swiperRef = React.useRef<SwiperType | null>(null);

  const {
    selectedImages,
    isBulkDeleting,
    isBulkSplitting,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    createBulkDeleteHandler,
    createBulkSplitHandler,
  } = useImageSelection({ images, isOpen });

  const handleBulkDelete = createBulkDeleteHandler(onBulkDelete);
  const handleBulkSplit = createBulkSplitHandler(onBulkSplit);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    if (swiperRef.current) {
      swiperRef.current.slideTo(initialIndex);
    }
  }, [initialIndex]);

  React.useEffect(() => {
    if (swiperRef.current && isOpen) {
      swiperRef.current.slideTo(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handleSlideChange = React.useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.activeIndex);
  }, []);

  useImageModalKeyboard({
    isOpen,
    images,
    currentIndex,
    selectedImages,
    onImageToggle,
    onBulkDelete: handleBulkDelete,
    onImageSelect: (imageId: string) => {
      const index = images.findIndex(img => img.id === imageId);
      if (index !== -1) {
        setCurrentIndex(index);
        swiperRef.current?.slideTo(index);
      }
    },
    onToggleSelection: toggleImageSelection,
  });

  if (!isOpen || images.length === 0) return null;

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(currentIndex, images.length - 1);
  const currentImage = images[safeCurrentIndex];

  // If currentImage is undefined, don't close the modal immediately
  // This prevents the modal from closing during image updates
  if (!currentImage) {
    // Only close if we have no images at all, not just a missing current image
    if (images.length === 0) {
      onClose();
      return null;
    }
    // If we have images but currentImage is undefined, just return null without closing
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Изображения"
      size="xl"
      className="!max-w-[95vw] md:!max-w-[calc(100vw-48px)] lg:!max-w-5xl [&>div]:!max-h-[85vh] md:[&>div]:!max-h-[90vh]"
      headerContent={
        <ImageModalHeader
          selectedCount={selectedImages.size}
          onSelectAll={selectAllImages}
          onDeselectAll={deselectAllImages}
          onBulkDelete={handleBulkDelete}
          onBulkSplit={handleBulkSplit}
          isBulkDeleting={isBulkDeleting}
          isBulkSplitting={isBulkSplitting}
          hasBulkDelete={!!onBulkDelete}
          hasBulkSplit={!!onBulkSplit}
        />
      }
    >
      <div className="relative flex flex-col pb-20 max-h-[calc(85vh-120px)] md:max-h-[calc(90vh-120px)]">
        {/* Swiper carousel - fixed height to prevent overlap with thumbnails */}
        <div className="relative mb-4 flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800" style={{ height: '350px', maxHeight: '350px', minHeight: '350px', overflow: 'hidden', position: 'relative' }}>
          <Swiper
            modules={[Navigation, Pagination, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            loop={false}
            navigation={{
              nextEl: '.image-modal-button-next',
              prevEl: '.image-modal-button-prev',
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
            initialSlide={initialIndex}
            onSwiper={swiper => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            className="!h-full !w-full"
          >
            {images.map((image, index) => {
              const isActive = image.isActive === true;
              const imageOpacity = isActive ? 'opacity-100' : 'opacity-30';

              return (
                <SwiperSlide key={image.id} className="!flex items-center justify-center" style={{ height: '100%' }}>
                  <div className="relative flex h-full w-full items-center justify-center p-4" style={{ height: '100%', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
                    <div className="relative flex items-center justify-center" style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}>
                      {/* Selection indicator */}
                      {selectedImages.has(image.id) && (
                        <div className="absolute left-2 top-2 z-10 rounded-full bg-blue-500 p-1">
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Main image */}
                      <Image
                        src={image.url}
                        alt={image.alt || `Изображение ${index + 1}`}
                        width={800}
                        height={600}
                        className={`object-contain transition-opacity ${imageOpacity} ${
                          selectedImages.has(image.id)
                            ? 'ring-4 ring-blue-500'
                            : ''
                        }`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain'
                        }}
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 80vw"
                        unoptimized
                      />

                      {/* Toggle button */}
                      {onImageToggle && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 md:right-4">
                          <button
                            onClick={e => onImageToggle(image.id, !isActive, e)}
                            disabled={isUpdating === image.id}
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-50 ${
                              isActive
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                            title={
                              isActive
                                ? 'Удалить изображение'
                                : 'Восстановить изображение'
                            }
                          >
                            {isUpdating === image.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : isActive ? (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                className="image-modal-button-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-2 text-gray-700 shadow-lg hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white sm:left-4"
                aria-label="Предыдущее изображение"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
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
                className="image-modal-button-next absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-2 text-gray-700 shadow-lg hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white sm:right-4"
                aria-label="Следующее изображение"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
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
        </div>

        {/* Badges */}
        <div className="flex-shrink-0 mb-2">
          <ImageModalBadges
            currentImage={currentImage}
            currentIndex={safeCurrentIndex}
            totalImages={images.length}
          />
        </div>

        {/* Thumbnail strip - fixed at bottom with reserved space */}
        <div className="absolute bottom-0 left-0 right-0 flex-shrink-0 z-10 bg-white dark:bg-gray-900 pt-2 border-t border-gray-200 dark:border-gray-700">
          <ImageModalThumbnails
            images={images}
            currentIndex={safeCurrentIndex}
            selectedImages={selectedImages}
            onImageSelect={index => {
              setCurrentIndex(index);
              swiperRef.current?.slideTo(index);
            }}
            onToggleSelection={toggleImageSelection}
          />
        </div>
      </div>
    </Modal>
  );
}
