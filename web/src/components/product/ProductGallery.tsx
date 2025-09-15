'use client';
import Image from 'next/image';
import React from 'react';

type GalleryImage = { url: string; alt?: string };

type Props = {
  images: GalleryImage[];
  alt: string;
};

export default function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = React.useState(0);
  const safeImages = images.length
    ? images
    : [{ url: '/images/demo/1.jpg', alt }];
  const active = safeImages[Math.min(index, safeImages.length - 1)];

  return (
    <div>
      <div className="border-border bg-background overflow-hidden rounded border">
        <div className="relative aspect-square">
          <Image
            src={active.url}
            alt={active.alt ?? alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {safeImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {safeImages.slice(0, 12).map((img, i) => {
            const isActive = i === index;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Показать фото ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded border ${
                  isActive ? 'border-primary' : 'border-border'
                } bg-background focus-visible:ring-primary/30 focus:outline-none focus-visible:ring-2`}
                onClick={() => setIndex(i)}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? alt}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
