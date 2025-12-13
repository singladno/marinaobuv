'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface MediaViewerItem {
  type: string;
  name: string;
  size?: number;
  data?: string;
  url?: string;
}

interface MediaViewerModalProps {
  mediaItems: MediaViewerItem[];
  initialIndex: number;
  onClose: () => void;
}

export function MediaViewerModal({
  mediaItems,
  initialIndex,
  onClose,
}: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);

  const currentMedia = mediaItems[currentIndex];

  // Reset zoom and rotation when changing media
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setIsVideoPlaying(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            swiperRef.current?.slidePrev();
          }
          break;
        case 'ArrowRight':
          if (currentIndex < mediaItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
            swiperRef.current?.slideNext();
          }
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.25, 3));
          break;
        case '-':
          setZoom(prev => Math.max(prev - 0.25, 0.25));
          break;
        case 'r':
        case 'R':
          setRotation(prev => (prev + 90) % 360);
          break;
        case ' ':
          if (currentMedia?.type.startsWith('video/')) {
            e.preventDefault();
            setIsVideoPlaying(prev => !prev);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, mediaItems.length, onClose, currentMedia?.type]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      swiperRef.current?.slidePrev();
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      swiperRef.current?.slideNext();
    }
  }, [currentIndex, mediaItems.length]);

  const handleDownload = useCallback(() => {
    if (!currentMedia) return;

    const url = currentMedia.data || currentMedia.url;
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = currentMedia.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentMedia]);

  const resetView = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  // Swiper event handlers
  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    swiperRef.current = swiper;
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.realIndex);
  }, []);

  if (!currentMedia) return null;

  const isImage = currentMedia.type.startsWith('image/');
  const isVideo = currentMedia.type.startsWith('video/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 text-white transition-colors hover:bg-transparent"
        aria-label="Close modal"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Media counter */}
      <div className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {mediaItems.length}
      </div>

      {/* Navigation buttons */}
      {mediaItems.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 text-white transition-colors hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === mediaItems.length - 1}
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 text-white transition-colors hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Media content with Swiper */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="relative h-full max-h-[80vh] w-full max-w-[80vw]">
          <Swiper
            modules={[Navigation, Pagination, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            loop={false}
            navigation={{
              nextEl: '.media-viewer-button-next',
              prevEl: '.media-viewer-button-prev',
            }}
            pagination={{
              clickable: true,
              bulletClass: 'media-viewer-pagination-bullet',
              bulletActiveClass: 'media-viewer-pagination-bullet-active',
            }}
            effect="fade"
            fadeEffect={{
              crossFade: true,
            }}
            speed={300}
            initialSlide={initialIndex}
            onSwiper={handleSwiperInit}
            onSlideChange={handleSlideChange}
            className="h-full w-full"
          >
            {mediaItems.map((media, index) => (
              <SwiperSlide key={index}>
                <div className="flex h-full w-full items-center justify-center">
                  {media.type.startsWith('image/') ? (
                    <div
                      className="relative cursor-zoom-in transition-transform duration-200 ease-in-out"
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      }}
                    >
                      <Image
                        src={media.data || media.url || ''}
                        alt={media.name}
                        width={800}
                        height={600}
                        className="max-h-full max-w-full rounded-lg object-contain"
                        unoptimized
                      />
                    </div>
                  ) : media.type.startsWith('video/') ? (
                    <div className="relative">
                      <video
                        src={media.data || media.url || ''}
                        controls
                        autoPlay={isVideoPlaying}
                        muted={isVideoMuted}
                        className="max-h-full max-w-full rounded-lg"
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="flex h-64 w-96 items-center justify-center rounded-lg bg-gray-800 text-white">
                      <div className="text-center">
                        <div className="mb-2 text-4xl">📄</div>
                        <div className="mb-2 font-medium">{media.name}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="border-white text-white hover:bg-white hover:text-black"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center space-x-2 rounded-full bg-black/50 p-2">
        {isImage && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
              className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
            >
              <span className="text-xs font-medium">
                {Math.round(zoom * 100)}%
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
              className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-4 w-px bg-white/30" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </>
        )}

        {isVideo && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVideoPlaying(prev => !prev)}
              className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
            >
              {isVideoPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVideoMuted(prev => !prev)}
              className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
            >
              {isVideoMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        <div className="mx-1 h-4 w-px bg-white/30" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnail strip for multiple media */}
      {mediaItems.length > 1 && (
        <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 space-x-2">
          {mediaItems.map((media, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                swiperRef.current?.slideTo(index);
              }}
              className={cn(
                'h-12 w-12 overflow-hidden rounded border-2 transition-all',
                index === currentIndex
                  ? 'border-white'
                  : 'border-transparent opacity-60 hover:opacity-80'
              )}
            >
              {media.type.startsWith('image/') ? (
                <Image
                  src={media.data || media.url || ''}
                  alt={media.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : media.type.startsWith('video/') ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-800">
                  <Play className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800">
                  <span className="text-xs text-white">📄</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Swiper Styles */}
      <style jsx global>{`
        .media-viewer-pagination {
          bottom: 20px !important;
        }

        .media-viewer-pagination-bullet {
          width: 12px !important;
          height: 12px !important;
          background: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
          margin: 0 6px !important;
        }

        .media-viewer-pagination-bullet-active {
          background: white !important;
        }

        .media-viewer-button-disabled {
          opacity: 0.3 !important;
          cursor: not-allowed !important;
        }
      `}</style>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10 cursor-pointer"
        onClick={onClose}
      />
    </div>
  );
}
