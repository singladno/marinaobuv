'use client';

import { useEffect, useRef, useState, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Play } from 'lucide-react';

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
}) as any;

interface LazyVideoProps {
  url: string;
  poster?: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  controls?: boolean;
  playing?: boolean;
}

export const LazyVideo = memo(function LazyVideo({
  url,
  poster,
  className = '',
  muted = true,
  loop = false,
  playsInline = true,
  onPlay,
  onPause,
  controls = false,
  playing = false,
}: LazyVideoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Small delay before loading to prevent too many simultaneous requests
            setTimeout(() => setShouldLoad(true), 100);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before it comes into view
        threshold: 0.1,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {poster ? (
          <Image
            src={poster}
            alt="Video poster"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <Play className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
    );
  }

  if (!shouldLoad) {
    return (
      <div className={`relative ${className}`}>
        {poster ? (
          <Image
            src={poster}
            alt="Video poster"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <Play className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        muted={muted}
        loop={loop}
        playsinline={playsInline}
        controls={controls}
        light={poster || false}
        onPlay={onPlay}
        onPause={onPause}
        config={
          {
            file: {
              attributes: {
                preload: 'none',
              },
            },
          } as any
        }
      />
    </div>
  );
});
