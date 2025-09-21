'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="w-full">
          <Image
            src={safeImages[0].url}
            alt={safeImages[0].alt || productName}
            width={448}
            height={336}
            className="h-auto w-full object-cover"
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
        <div className="w-full">
          <Image
            src={safeImages[currentIndex].url}
            alt={safeImages[currentIndex].alt || productName}
            width={448}
            height={336}
            className="h-auto w-full object-cover"
            priority
          />
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
          onClick={goToNext}
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
                className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                  index === currentIndex
                    ? 'border-foreground ring-foreground ring-2'
                    : 'border-muted hover:border-muted-foreground'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.alt || productName}
                  width={100}
                  height={100}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default ProductGallery;
