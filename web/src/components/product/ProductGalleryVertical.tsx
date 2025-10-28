'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUser } from '@/contexts/NextAuthUserContext';
import { ProductSourceModal } from './ProductSourceModal';
import { UnavailableProductOverlay } from './UnavailableProductOverlay';

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
  height?: number; // px height for main image container
  productId?: string;
  sourceMessageIds?: string[] | null;
  isActive: boolean;
}

export default function ProductGalleryVertical({
  images,
  productName,
  height = 560,
  productId,
  sourceMessageIds,
  isActive,
}: ProductGalleryProps) {
  const { user } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
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

  return (
    <div className="mx-auto flex gap-4">
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

          {/* Unavailable overlay */}
          {!isActive && <UnavailableProductOverlay />}
        </div>

        {/* Source Chip - shows on hover, only for admin users */}
        {user?.role === 'ADMIN' &&
          productId &&
          sourceMessageIds &&
          sourceMessageIds.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSourceModalOpen(true)}
              className="absolute left-3 top-3 z-20 opacity-0 transition-all duration-200 group-hover:opacity-100"
              title="Просмотр источника сообщений"
            >
              <Badge
                variant="secondary"
                className="cursor-pointer border-0 bg-purple-500/80 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-purple-600/80"
              >
                Источник
              </Badge>
            </button>
          )}

        {/* Nav arrows */}
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

      {/* Source Modal - only for admin users */}
      {user?.role === 'ADMIN' && productId && (
        <ProductSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          productId={productId}
          productName={productName}
        />
      )}
    </div>
  );
}
