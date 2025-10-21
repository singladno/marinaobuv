'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({ images, alt, className }: ImageCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        handleModalClose();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          'mb-6 flex h-72 w-full items-center justify-center rounded-lg bg-gray-100',
          className
        )}
      >
        <span className="text-sm text-gray-400">Нет изображений</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn('relative mb-6 w-full cursor-pointer', className)}
        onClick={handleImageClick}
      >
        <Swiper
          modules={[Navigation, Pagination, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet-custom',
            bulletActiveClass: 'swiper-pagination-bullet-active-custom',
          }}
          effect="fade"
          fadeEffect={{
            crossFade: true,
          }}
          speed={300}
          onSwiper={swiper => {
            swiperRef.current = swiper;
          }}
          onSlideChange={swiper => {
            setActiveIndex(swiper.realIndex);
          }}
          className="h-72 w-full overflow-hidden rounded-lg"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative h-full w-full bg-gray-100">
                <Image
                  src={image}
                  alt={`${alt} - ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="swiper-button-prev-custom absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white transition-all hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Previous image"
              onClick={e => e.stopPropagation()}
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              className="swiper-button-next-custom absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white transition-all hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Next image"
              onClick={e => e.stopPropagation()}
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute right-2 top-2 z-10 rounded bg-black/50 px-2 py-1 text-xs text-white">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        <style jsx global>{`
          .swiper-pagination-custom {
            bottom: 8px !important;
          }

          .swiper-pagination-bullet-custom {
            width: 8px !important;
            height: 8px !important;
            background: rgba(255, 255, 255, 0.5) !important;
            opacity: 1 !important;
            margin: 0 4px !important;
          }

          .swiper-pagination-bullet-active-custom {
            background: white !important;
          }

          .swiper-button-disabled {
            opacity: 0.3 !important;
            cursor: not-allowed !important;
          }
        `}</style>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={handleModalClose}
        >
          <div
            className="relative h-full w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleModalClose}
              className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Full Screen Swiper */}
            <Swiper
              modules={[Navigation, Pagination, EffectFade]}
              spaceBetween={0}
              slidesPerView={1}
              loop={true}
              navigation={{
                nextEl: '.modal-swiper-button-next',
                prevEl: '.modal-swiper-button-prev',
              }}
              pagination={{
                clickable: true,
                bulletClass: 'modal-swiper-pagination-bullet',
                bulletActiveClass: 'modal-swiper-pagination-bullet-active',
              }}
              effect="fade"
              fadeEffect={{
                crossFade: true,
              }}
              speed={300}
              initialSlide={activeIndex}
              className="h-full w-full"
            >
              {images.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="flex h-full w-full items-center justify-center p-8">
                    <Image
                      src={image}
                      alt={`${alt} - ${index + 1}`}
                      width={1200}
                      height={800}
                      className="max-h-full max-w-full object-contain"
                      sizes="100vw"
                      priority={index === activeIndex}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Modal Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  className="modal-swiper-button-prev absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Previous image"
                >
                  <svg
                    className="h-6 w-6"
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
                  className="modal-swiper-button-next absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Next image"
                >
                  <svg
                    className="h-6 w-6"
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

            {/* Modal Styles */}
            <style jsx global>{`
              .modal-swiper-pagination {
                bottom: 20px !important;
              }

              .modal-swiper-pagination-bullet {
                width: 12px !important;
                height: 12px !important;
                background: rgba(255, 255, 255, 0.5) !important;
                opacity: 1 !important;
                margin: 0 6px !important;
              }

              .modal-swiper-pagination-bullet-active {
                background: white !important;
              }

              .modal-swiper-button-disabled {
                opacity: 0.3 !important;
                cursor: not-allowed !important;
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}
