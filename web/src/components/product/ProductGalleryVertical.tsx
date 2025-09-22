'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
  height?: number; // px height for main image container
}

export default function ProductGalleryVertical({
  images,
  productName,
  height = 560,
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeImages =
    images?.length > 0
      ? images
      : [{ url: '/images/demo/1.jpg', alt: productName }];

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
        <div className="relative w-full" style={{ height: `${height}px` }}>
          <Image
            src={safeImages[currentIndex].url}
            alt={safeImages[currentIndex].alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain"
            priority
          />
        </div>

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
    </div>
  );
}
