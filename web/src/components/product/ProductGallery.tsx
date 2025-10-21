'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages =
    images?.length > 0
      ? images
      : [{ url: '/images/demo/1.jpg', alt: productName }];

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(prevIndex =>
      prevIndex === 0 ? safeImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex =>
      prevIndex === safeImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (safeImages.length === 1) {
    return (
      <Card className="mx-auto max-w-md overflow-hidden border-0 shadow-sm">
        <div className="relative aspect-[4/3] w-full bg-white">
          <Image
            src={safeImages[0].url}
            alt={safeImages[0].alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-contain"
            priority
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md overflow-hidden border-0 shadow-sm">
      {/* Main Image Container */}
      <div className="group relative">
        <div className="relative aspect-[4/3] w-full bg-white">
          <Image
            src={safeImages[currentIndex].url}
            alt={safeImages[currentIndex].alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation Arrows */}
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

        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
          {currentIndex + 1} / {safeImages.length}
        </div>
      </div>

      {/* Thumbnail Grid */}
      {safeImages.length > 1 && (
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {safeImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                title={`Показать фото ${index + 1}`}
                aria-label={`Показать фото ${index + 1}`}
                className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                  index === currentIndex
                    ? 'border-foreground ring-foreground ring-2'
                    : 'border-muted hover:border-muted-foreground'
                }`}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={image.url}
                    alt={image.alt || productName}
                    fill
                    sizes="100px"
                    className="object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default ProductGallery;
