import * as React from 'react';

import {
  getThumbnailUrl,
  isWAParserImage,
  isS3Image,
  sanitizeImageUrl,
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
  onImageToggle,
  isUpdating,
  index,
}: ImageThumbnailProps) {
  const thumbnailUrl = getThumbnailUrl(image.url);
  const isS3 = isS3Image(image.url);
  const sanitizedUrl = sanitizeImageUrl(image.url);

  const isActive = image.isActive === true;
  const imageOpacity = isActive ? 'opacity-100' : 'opacity-30';

  const borderClasses = image.isPrimary
    ? 'border-2 border-blue-500 dark:border-blue-400'
    : image.isFalseImage
      ? 'border-2 border-red-500 dark:border-red-400'
      : 'border border-gray-200 dark:border-gray-700';

  const badge = image.isPrimary ? (
    <span className="absolute left-0 top-0 m-0.5 rounded bg-blue-500 px-1 text-[10px] text-white">
      ★
    </span>
  ) : image.isFalseImage ? (
    <span className="absolute left-0 top-0 m-0.5 rounded bg-red-500 px-1 text-[10px] text-white">
      ✗
    </span>
  ) : image.color ? (
    <span className="absolute bottom-0 right-0 m-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
      {image.color}
    </span>
  ) : null;

  return (
    <div key={image.id} className="group relative h-12 w-12 flex-shrink-0">
      <button
        onClick={() => onImageClick(index)}
        className={`relative h-full w-full overflow-hidden rounded-md border transition-colors hover:border-blue-300 dark:hover:border-blue-600 ${borderClasses}`}
        title="Нажмите для просмотра в полном размере"
      >
        <img
          src={thumbnailUrl}
          alt={image.alt || `Изображение ${(image.sort || 0) + 1}`}
          className={`h-full w-full object-cover transition-opacity ${imageOpacity}`}
          loading="lazy"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            console.error('Failed to load S3 image:', thumbnailUrl);
          }}
        />
        {badge}
      </button>
    </div>
  );
}
