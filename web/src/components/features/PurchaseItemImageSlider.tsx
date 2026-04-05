'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

export type PurchaseGalleryImage = {
  id: string;
  url: string;
  color?: string | null;
  isPrimary: boolean;
  sort: number;
};

export type PurchaseItemForGallery = {
  color?: string | null;
  product: { images: PurchaseGalleryImage[] };
};

/** Same color filter + sort as the old modal; used for list slider and drag preview. */
export function getPurchaseItemGalleryImages(
  item: PurchaseItemForGallery
): PurchaseGalleryImage[] {
  const normalize = (s?: string | null) => (s || '').trim().toLowerCase();
  const itemColor = normalize(item.color);
  let imgs = [...(item.product.images || [])];
  if (itemColor) {
    const byColor = imgs.filter(img => normalize(img.color) === itemColor);
    if (byColor.length > 0) imgs = byColor;
  }
  return imgs.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.sort ?? 0) - (b.sort ?? 0);
  });
}

function PurchaseItemImageSliderInner({
  images,
  alt,
}: {
  images: PurchaseGalleryImage[];
  alt: string;
}) {
  const pagination =
    images.length > 1
      ? { clickable: true, dynamicBullets: images.length > 5 }
      : false;

  if (images.length === 0) {
    return (
      <div className="bg-muted flex aspect-square w-full items-center justify-center rounded-lg">
        <span className="text-sm text-gray-500">Нет фото</span>
      </div>
    );
  }

  return (
    <div
      className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg"
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute inset-0">
        <Swiper
          modules={[Pagination]}
          pagination={pagination}
          watchSlidesProgress={false}
          className="h-full w-full [&_.swiper-pagination-bullet-active]:bg-purple-600 [&_.swiper-pagination]:bottom-2"
          slidesPerView={1}
          spaceBetween={0}
        >
          {images.map(img => (
            <SwiperSlide key={img.id}>
              <div className="relative h-full w-full">
                <Image
                  src={img.url}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 42vw, 240px"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

/** Stable props avoid re-initializing Swiper when parent re-renders during drag. */
export const PurchaseItemImageSlider = memo(
  PurchaseItemImageSliderInner,
  (prev, next) =>
    prev.alt === next.alt &&
    prev.images.length === next.images.length &&
    prev.images.every((img, i) => img.id === next.images[i]?.id)
);
