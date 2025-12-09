'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  url: string;
  poster?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export const VideoThumbnail = memo(function VideoThumbnail({
  url,
  poster,
  alt,
  className = '',
  onClick,
}: VideoThumbnailProps) {
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {poster ? (
        <Image
          src={poster}
          alt={alt || 'Video thumbnail'}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        // Use video element to generate thumbnail from video itself
        <video
          src={url}
          preload="metadata"
          className="h-full w-full object-cover"
          muted
          playsInline
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <Play className="h-4 w-4 text-white" fill="white" />
      </div>
    </div>
  );
});
