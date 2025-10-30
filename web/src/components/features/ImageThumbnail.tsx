import Image from 'next/image';
import * as React from 'react';

import {
  getThumbnailUrl,
  // isWAParserImage,
} from '@/lib/image-security';

interface ImageThumbnailProps {
  image: {
    id: string;
    url: string;
    isPrimary?: boolean;
    isFalseImage?: boolean;
    isActive?: boolean;
    color?: string | null;
    sort?: number;
    alt?: string | null;
  };
  onImageClick: (index: number) => void;
  onImageToggle: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  isUpdating: boolean;
  index: number;
}

export function ImageThumbnail({
  image,
  onImageClick,
  // onImageToggle,
  // isUpdating,
  index,
}: ImageThumbnailProps) {
  const [imageError, setImageError] = React.useState(false);
  const thumbnailUrl = getThumbnailUrl(image.url);
  // const isS3 = isS3Image(image.url);
  // const sanitizedUrl = sanitizeImageUrl(image.url);

  // Treat undefined as active; only dim when explicitly marked inactive
  const isActive = image.isActive !== false;
  const imageOpacity = isActive ? 'opacity-100' : 'opacity-30';

  const borderClasses = image.isPrimary
    ? 'border-2 border-blue-500 dark:border-blue-400'
    : image.isFalseImage
      ? 'border-2 border-red-500 dark:border-red-400'
      : 'border border-gray-200 dark:border-gray-700';

  // Render overlays independently so primary star doesn't hide color badge
  const badge = (
    <>
      {image.isFalseImage ? (
        <span className="absolute left-0 top-0 m-0.5 rounded bg-red-500 px-1 text-[10px] text-white">✗</span>
      ) : image.isPrimary ? (
        <span className="absolute left-0 top-0 m-0.5 rounded bg-blue-500 px-1 text-[10px] text-white">★</span>
      ) : null}
      {image.color ? (
        <span className="absolute bottom-0 right-0 m-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
          {image.color}
        </span>
      ) : null}
    </>
  );

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load S3 image:', thumbnailUrl);
  };

  return (
    <div key={image.id} className="group relative h-12 w-12 flex-shrink-0">
      <button
        onClick={() => onImageClick(index)}
        className={`relative h-full w-full cursor-pointer overflow-hidden rounded-md border transition-colors hover:border-blue-300 dark:hover:border-blue-600 ${borderClasses}`}
        title="Нажмите для просмотра в полном размере"
      >
        {imageError ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        ) : (
          <Image
            src={thumbnailUrl}
            alt={image.alt || `Изображение ${(image.sort || 0) + 1}`}
            width={150}
            height={150}
            className={`h-full w-full object-cover transition-opacity ${imageOpacity}`}
            loading="lazy"
            onError={handleImageError}
          />
        )}
        {badge}
      </button>
    </div>
  );
}
