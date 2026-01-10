'use client';

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Hand,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { useUser } from '@/contexts/NextAuthUserContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { EditProductModal } from '@/components/admin/EditProductModal';
import { ProductSourceModal } from './ProductSourceModal';
import { AggregatorIcon } from '@/components/icons/AggregatorIcon';
import { UnavailableProductOverlay } from './UnavailableProductOverlay';
import { VideoThumbnail } from '@/components/ui/VideoThumbnail';
import {
  ProductVideoPlayer,
  type ReactPlayerInstance,
} from './ProductVideoPlayer';
import { cn } from '@/lib/utils';

type Video = {
  id: string;
  url: string;
  alt?: string;
  sort: number;
  duration?: number;
};

interface ProductGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  videos?: Video[];
  productName: string;
  height?: number; // px height for main image container
  productId?: string;
  sourceMessageIds?: string[] | null;
  sourceScreenshotUrl?: string | null;
  isActive: boolean;
  source?: 'WA' | 'AG' | 'MANUAL';
}

type MediaItem = {
  type: 'video' | 'image';
  url: string;
  alt?: string;
  id?: string;
  poster?: string; // For videos, use first image as poster
};

export default function ProductGalleryVertical({
  images,
  videos = [],
  productName,
  height = 560,
  productId,
  sourceMessageIds,
  sourceScreenshotUrl,
  isActive,
  source,
}: ProductGalleryProps) {
  const { user } = useUser();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isAgSourceModalOpen, setIsAgSourceModalOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [loadingProductData, setLoadingProductData] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [optimisticIsActive, setOptimisticIsActive] = useState(isActive);
  const swiperRef = useRef<SwiperType | null>(null);
  const playerRefs = useRef<{
    [key: number]: { getInternalPlayer: () => HTMLVideoElement | null } | null;
  }>({});
  const lastSlideChangeRef = useRef<number>(-1);
  const [videoStates, setVideoStates] = useState<{
    [key: number]: {
      isPlaying: boolean;
      isMuted: boolean;
      played: number;
      playedSeconds: number;
      duration: number;
    };
  }>({});
  const isAdmin = user?.role === 'ADMIN';

  // Combine videos and images: videos first, then images
  // Videos don't have a poster - VideoThumbnail will show a placeholder with play icon
  const mediaItems: MediaItem[] = [
    ...(videos || []).map(v => ({
      type: 'video' as const,
      url: v.url,
      alt: v.alt,
      id: v.id,
      poster: undefined, // No poster - VideoThumbnail will show placeholder
    })),
    ...(images || []).map(img => ({
      type: 'image' as const,
      url: img.url,
      alt: img.alt,
    })),
  ];

  // Set initial index to first image (after videos)
  const initialIndex = videos?.length > 0 ? videos.length : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync optimistic state with prop when it changes externally
  useEffect(() => {
    setOptimisticIsActive(isActive);
  }, [isActive]);

  const handleToggleActive = async (checked: boolean) => {
    if (!productId || isTogglingActive) return;

    // Optimistic update - update UI immediately
    const previousValue = optimisticIsActive;
    setOptimisticIsActive(checked);
    setIsTogglingActive(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId,
          isActive: checked,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Success - optimistic update was correct, no need to refetch
      // The prop will update on next page load/navigation
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticIsActive(previousValue);
    } finally {
      setIsTogglingActive(false);
    }
  };
  // Ensure we have at least one media item
  const safeMediaItems =
    mediaItems.length > 0
      ? mediaItems
      : [
          {
            type: 'image' as const,
            url: '/images/demo/1.jpg',
            alt: productName,
          },
        ];

  // Ensure currentIndex is always valid when media changes
  useEffect(() => {
    if (currentIndex > safeMediaItems.length - 1) {
      // Reset to first image (after videos) or 0
      const newInitial = videos?.length > 0 ? videos.length : 0;
      setCurrentIndex(Math.min(newInitial, safeMediaItems.length - 1));
    }
  }, [safeMediaItems.length, currentIndex, videos?.length]);

  const clampedIndex = Math.min(
    currentIndex,
    Math.max(0, safeMediaItems.length - 1)
  );

  const currentMedia = safeMediaItems[clampedIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

  // Initialize video state only for videos that exist
  useEffect(() => {
    const newStates: typeof videoStates = {};
    safeMediaItems.forEach((media, index) => {
      if (media.type === 'video') {
        newStates[index] = {
          isPlaying: false,
          isMuted: true,
          played: 0,
          playedSeconds: 0,
          duration: 0,
        };
      }
    });
    setVideoStates(prev => {
      // Only update if structure changed, preserve existing state
      const keysChanged = Object.keys(newStates).some(
        key => !prev[Number(key)]
      );
      return keysChanged ? { ...prev, ...newStates } : prev;
    });
  }, [safeMediaItems.length]);

  // DISABLED: Auto-play video when it becomes the current item
  // This was causing infinite loops - user must manually click play
  // const autoPlayTriggeredRef = useRef<Set<number>>(new Set());
  // useEffect(() => {
  //   if (isCurrentVideo && !autoPlayTriggeredRef.current.has(clampedIndex)) {
  //     const timer = setTimeout(() => {
  //       if (clampedIndex === currentIndex) {
  //         setVideoStates(prev => {
  //           const currentState = prev[clampedIndex];
  //           if (!currentState?.isPlaying) {
  //             autoPlayTriggeredRef.current.add(clampedIndex);
  //             return {
  //               ...prev,
  //               [clampedIndex]: {
  //                 ...(currentState || {
  //                   isPlaying: false,
  //                   isMuted: true,
  //                   played: 0,
  //                   playedSeconds: 0,
  //                   duration: 0,
  //                 }),
  //                 isPlaying: true,
  //               },
  //             };
  //           }
  //           return prev;
  //         });
  //       }
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isCurrentVideo, clampedIndex, currentIndex]);

  const pauseAllVideos = useCallback(() => {
    Object.values(playerRefs.current).forEach(player => {
      if (player) {
        player.getInternalPlayer()?.pause();
      }
    });
    setVideoStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[Number(key)] = {
          ...updated[Number(key)],
          isPlaying: false,
        };
      });
      return updated;
    });
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      pauseAllVideos();
      setCurrentIndex(index);
    },
    [pauseAllVideos]
  );

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleThumbnailHover = useCallback(
    (index: number) => {
      // Clear any pending hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      pauseAllVideos();
      setCurrentIndex(index);

      // Auto-play video when hovering over video thumbnail
      const media = safeMediaItems[index];
      if (media?.type === 'video') {
        hoverTimeoutRef.current = setTimeout(() => {
          setVideoStates(prev => {
            const currentState = prev[index];
            if (!currentState?.isPlaying) {
              return {
                ...prev,
                [index]: {
                  ...(currentState || {
                    isPlaying: false,
                    isMuted: true,
                    played: 0,
                    playedSeconds: 0,
                    duration: 0,
                  }),
                  isPlaying: true,
                },
              };
            }
            return prev;
          });
        }, 300);
      }
    },
    [pauseAllVideos, safeMediaItems]
  );

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleThumbnailLeave = useCallback(() => {
    // Keep current media playing
  }, []);

  // Video control handlers
  const handlePlayPause = useCallback(() => {
    console.log('[ProductGallery] Play/Pause clicked', {
      index: clampedIndex,
      currentState: videoStates[clampedIndex],
      mediaType: safeMediaItems[clampedIndex]?.type,
      url: safeMediaItems[clampedIndex]?.url,
    });
    // Use functional update to prevent double updates
    setVideoStates(prev => {
      const currentState = prev[clampedIndex];
      const newState = !currentState?.isPlaying;
      console.log('[ProductGallery] Setting playing state', {
        index: clampedIndex,
        playing: newState,
        prevPlaying: currentState?.isPlaying,
      });
      // Only update if state actually changed
      if (currentState?.isPlaying === newState) {
        return prev; // No change needed
      }
      return {
        ...prev,
        [clampedIndex]: {
          ...(currentState || {
            isPlaying: false,
            isMuted: true,
            played: 0,
            playedSeconds: 0,
            duration: 0,
          }),
          isPlaying: newState,
        },
      };
    });
  }, [clampedIndex, safeMediaItems]);

  const handleMuteToggle = useCallback(() => {
    setVideoStates(prev => ({
      ...prev,
      [clampedIndex]: {
        ...prev[clampedIndex],
        isMuted: !prev[clampedIndex]?.isMuted,
      },
    }));
  }, [clampedIndex]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      const player = playerRefs.current[clampedIndex];
      if (player && player.getInternalPlayer()) {
        const video = player.getInternalPlayer() as HTMLVideoElement;
        video.currentTime = newValue;
      }
      setVideoStates(prev => ({
        ...prev,
        [clampedIndex]: {
          ...prev[clampedIndex],
          played: newValue / (prev[clampedIndex]?.duration || 1),
          playedSeconds: newValue,
        },
      }));
    },
    [clampedIndex]
  );

  const handleVideoProgress = useCallback(
    (index: number) =>
      (progress: { played: number; playedSeconds: number }) => {
        // Only update if this is still the current video to prevent unnecessary re-renders
        if (index === currentIndex) {
          setVideoStates(prev => {
            const currentState = prev[index];
            // Only update if values actually changed significantly
            const timeDiff = Math.abs(
              progress.playedSeconds - (currentState?.playedSeconds || 0)
            );
            if (timeDiff < 0.2 && currentState) {
              return prev; // Skip update if change is too small
            }
            return {
              ...prev,
              [index]: {
                ...(currentState || {
                  isPlaying: false,
                  isMuted: true,
                  played: 0,
                  playedSeconds: 0,
                  duration: 0,
                }),
                played: progress.played,
                playedSeconds: progress.playedSeconds,
              },
            };
          });
        }
      },
    [currentIndex]
  );

  const handleVideoDuration = useCallback(
    (index: number) => (duration: number) => {
      setVideoStates(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          duration,
        },
      }));
    },
    []
  );

  const handleVideoPlay = useCallback(
    (index: number) => () => {
      setVideoStates(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          isPlaying: true,
        },
      }));
    },
    []
  );

  const handleVideoPause = useCallback(
    (index: number) => () => {
      setVideoStates(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          isPlaying: false,
        },
      }));
    },
    []
  );

  // Create stable ref callbacks to prevent component remounting
  // Store media URLs in a ref to avoid dependency on safeMediaItems array
  const mediaUrlsRef = useRef<Record<number, string>>({});
  useEffect(() => {
    safeMediaItems.forEach((media, index) => {
      if (media.type === 'video') {
        mediaUrlsRef.current[index] = media.url;
      }
    });
  }, [safeMediaItems]);

  // Stable ref callback - only depends on index, not media items
  const createVideoPlayerRef = useCallback(
    (index: number) => (el: ReactPlayerInstance | null) => {
      if (el) {
        playerRefs.current[index] = el;
      } else {
        delete playerRefs.current[index];
      }
    },
    [] // Empty deps - stable callback
  );

  const currentVideoState = videoStates[clampedIndex] || {
    isPlaying: false,
    isMuted: true,
    played: 0,
    playedSeconds: 0,
    duration: 0,
  };

  const goToPrevious = () =>
    setCurrentIndex(prev =>
      prev === 0 ? safeMediaItems.length - 1 : prev - 1
    );
  const goToNext = () =>
    setCurrentIndex(prev =>
      prev === safeMediaItems.length - 1 ? 0 : prev + 1
    );

  // Mobile/iPad Swiper component - same layout as desktop but with Swiper
  const MobileSwiper = (
    <div className="flex gap-4 xl:hidden">
      {/* Left thumbnails */}
      <div className="flex w-20 shrink-0 flex-col gap-2 overflow-y-auto">
        {safeMediaItems.map((media, index) => (
          <button
            key={media.id || index}
            onClick={() => {
              setCurrentIndex(index);
              if (swiperRef.current) {
                swiperRef.current.slideTo(index);
              }
            }}
            title={
              media.type === 'video'
                ? `Показать видео ${index + 1}`
                : `Показать фото ${index + 1}`
            }
            aria-label={
              media.type === 'video'
                ? `Показать видео ${index + 1}`
                : `Показать фото ${index + 1}`
            }
            className={`relative aspect-square overflow-hidden rounded-md border transition-colors ${
              index === currentIndex
                ? 'border-purple-600 ring-1 ring-purple-600'
                : 'border-muted hover:border-purple-500'
            }`}
          >
            <div className="relative h-full w-full">
              {media.type === 'video' ? (
                <VideoThumbnail
                  url={media.url}
                  poster={media.poster}
                  alt={media.alt || productName}
                  className="h-full w-full"
                />
              ) : (
                <Image
                  src={media.url}
                  alt={media.alt || productName}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main image block with Swiper */}
      <Card className="group relative min-w-0 flex-1 overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <div
          className="product-gallery-main relative w-full max-w-full overflow-hidden"
          style={{ '--gallery-height': `${height}px` } as React.CSSProperties}
        >
          <div className="relative h-full w-full max-w-full">
            {/* Native HTML5 video player - Next.js recommended approach */}
            {isCurrentVideo && currentMedia.url && (
              <div className="pointer-events-auto absolute inset-0 z-10">
                <ProductVideoPlayer
                  key={`video-${currentMedia.url}`}
                  ref={createVideoPlayerRef(clampedIndex)}
                  url={currentMedia.url}
                  poster={currentMedia.poster}
                  playing={currentVideoState.isPlaying}
                  muted={currentVideoState.isMuted}
                  loop
                  onPlay={handleVideoPlay(clampedIndex)}
                  onPause={handleVideoPause(clampedIndex)}
                  onProgress={handleVideoProgress(clampedIndex)}
                  onDuration={handleVideoDuration(clampedIndex)}
                  className="h-full w-full"
                />
              </div>
            )}
            <Swiper
              key={`swiper-${safeMediaItems.length}-${initialIndex}`}
              modules={[Navigation]}
              spaceBetween={0}
              slidesPerView={1}
              navigation={{
                nextEl: '.product-swiper-button-next',
                prevEl: '.product-swiper-button-prev',
              }}
              onSlideChange={swiper => {
                const newIndex = swiper.activeIndex;
                // Only update if index actually changed and we haven't processed this change yet
                if (
                  newIndex !== currentIndex &&
                  newIndex !== lastSlideChangeRef.current
                ) {
                  lastSlideChangeRef.current = newIndex;
                  console.log('[ProductGallery] Swiper slide change', {
                    from: currentIndex,
                    to: newIndex,
                    mediaType: safeMediaItems[newIndex]?.type,
                  });
                  pauseAllVideos();
                  setCurrentIndex(newIndex);
                }
              }}
              onSwiper={swiper => {
                swiperRef.current = swiper;
              }}
              className="h-full w-full max-w-full"
              initialSlide={currentIndex}
              allowTouchMove={true}
              preventInteractionOnTransition={true}
              updateOnWindowResize={false}
              observer={false}
              observeParents={false}
              watchSlidesProgress={false}
              // Keep all slides mounted to prevent video player from unmounting
              virtual={false}
              loop={false}
            >
              {safeMediaItems.map((media, index) => {
                const isCurrent = index === currentIndex;
                const mediaKey = `media-${media.id || index}`;
                const isVideo = media.type === 'video';

                return (
                  <SwiperSlide key={mediaKey} className="!w-full">
                    <div className="relative h-full w-full max-w-full">
                      {isVideo ? (
                        <>
                          {/* Show poster image - video player rendered separately outside Swiper */}
                          {isCurrent ? (
                            <Image
                              key={`video-poster-${mediaKey}`}
                              src={media.poster || media.url}
                              alt={media.alt || productName}
                              fill
                              sizes="(max-width: 768px) 100vw, 640px"
                              className="pointer-events-none object-contain opacity-0"
                              loading="lazy"
                              unoptimized={!media.poster}
                            />
                          ) : (
                            <Image
                              key={`video-poster-${mediaKey}`}
                              src={media.poster || media.url}
                              alt={media.alt || productName}
                              fill
                              sizes="(max-width: 768px) 100vw, 640px"
                              className="object-contain"
                              loading="lazy"
                              unoptimized={!media.poster}
                            />
                          )}
                          {/* Custom Video Controls for Mobile */}
                          {index === currentIndex && (
                            <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-white/90 via-white/70 to-transparent p-2 backdrop-blur-sm">
                              <div className="flex items-center gap-1.5">
                                {/* Play/Pause Button */}
                                <button
                                  onClick={handlePlayPause}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md transition-all duration-200 hover:from-purple-700 hover:to-purple-800 hover:shadow-lg active:scale-95"
                                  aria-label={
                                    videoStates[index]?.isPlaying
                                      ? 'Pause'
                                      : 'Play'
                                  }
                                >
                                  {videoStates[index]?.isPlaying ? (
                                    <Pause className="h-3 w-3 text-white" />
                                  ) : (
                                    <Play className="ml-0.5 h-3 w-3 text-white" />
                                  )}
                                </button>

                                {/* Progress Bar */}
                                <div className="flex flex-1 items-center">
                                  <input
                                    type="range"
                                    min="0"
                                    max={videoStates[index]?.duration || 0}
                                    value={
                                      videoStates[index]?.playedSeconds || 0
                                    }
                                    onChange={handleSeek}
                                    className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-purple-200/50 accent-purple-500 transition-[background] duration-100 ease-out [&::-moz-range-thumb]:h-0 [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:appearance-none"
                                    aria-label="Video progress"
                                    title="Перемотка видео"
                                    style={{
                                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${
                                        videoStates[index]?.duration
                                          ? ((videoStates[index]
                                              ?.playedSeconds || 0) /
                                              videoStates[index]?.duration) *
                                            100
                                          : 0
                                      }%, rgba(196, 181, 253, 0.5) ${
                                        videoStates[index]?.duration
                                          ? ((videoStates[index]
                                              ?.playedSeconds || 0) /
                                              videoStates[index]?.duration) *
                                            100
                                          : 0
                                      }%, rgba(196, 181, 253, 0.5) 100%)`,
                                    }}
                                  />
                                </div>

                                {/* Mute/Unmute Button */}
                                <button
                                  onClick={handleMuteToggle}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-purple-500/20 text-purple-700 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-purple-500/30 active:scale-95"
                                  aria-label={
                                    videoStates[index]?.isMuted
                                      ? 'Unmute'
                                      : 'Mute'
                                  }
                                >
                                  {videoStates[index]?.isMuted ? (
                                    <VolumeX className="h-3 w-3 text-purple-700" />
                                  ) : (
                                    <Volume2 className="h-3 w-3 text-purple-700" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <Image
                          key={`image-${mediaKey}`}
                          src={media.url}
                          alt={media.alt || productName}
                          fill
                          sizes="(max-width: 768px) 100vw, 640px"
                          className="max-w-full object-contain"
                          priority={index === initialIndex}
                          unoptimized={false}
                        />
                      )}
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Unavailable overlay */}
          {!optimisticIsActive && <UnavailableProductOverlay />}

          {/* Admin controls - Source and Edit icons */}
          {isAdmin && productId && (
            <div className="absolute left-2 top-2 z-20 flex gap-2">
              {/* Source indicator */}
              {source && (
                <>
                  {source === 'MANUAL' ? (
                    <div className="group/manual-icon source-icon-hover-toggle relative flex h-12 w-12 items-center justify-center transition-all duration-200">
                      <Hand
                        className="h-5 w-5 fill-purple-500/20 text-white"
                        strokeWidth={1.5}
                      />
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 opacity-0 shadow-xl transition-opacity duration-200 group-hover/manual-icon:block group-hover/manual-icon:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        Товар добавлен вручную
                        <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"></div>
                      </div>
                    </div>
                  ) : source === 'AG' ? (
                    <button
                      type="button"
                      onClick={async e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!productId) return;

                        // If we already have the screenshot URL, open modal immediately
                        if (sourceScreenshotUrl) {
                          setIsAgSourceModalOpen(true);
                          return;
                        }

                        // Otherwise, fetch product data to get screenshot URL
                        setLoadingProductData(true);
                        setIsAgSourceModalOpen(true); // Open modal immediately, will show loading state
                        try {
                          const response = await fetch(
                            `/api/admin/products/${productId}`
                          );
                          if (response.ok) {
                            const data = await response.json();
                            setProductData(data.product);
                          }
                        } catch (error) {
                          console.error(
                            'Error fetching product data:',
                            error
                          );
                        } finally {
                          setLoadingProductData(false);
                        }
                      }}
                      className="source-icon-hover-toggle transition-all duration-200 focus:outline-none"
                      title="Просмотреть исходный скриншот агрегатора"
                    >
                      <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                        <AggregatorIcon className="h-full w-full" />
                      </div>
                    </button>
                  ) : sourceMessageIds && sourceMessageIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setIsSourceModalOpen(true)}
                      className="source-icon-hover-toggle transition-all duration-200 focus:outline-none"
                      title="Просмотр источника сообщений"
                    >
                      {source === 'WA' ? (
                        <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                          <Image
                            src="/images/whatsapp-icon.png"
                            alt="WhatsApp"
                            width={48}
                            height={48}
                            className="h-full w-full rounded"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer border-0 bg-purple-500/80 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-purple-600/80"
                        >
                          Источник
                        </Badge>
                      )}
                    </button>
                  ) : null}
                </>
              )}

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="source-icon-hover-toggle inline-flex cursor-pointer items-center justify-center text-white transition-all duration-200 hover:scale-110 focus:outline-none"
                title="Редактировать товар"
              >
                <Pencil className="h-5 w-5 fill-purple-500/20 text-white" />
              </button>
            </div>
          )}

          {/* Navigation buttons - hidden on mobile only, visible on iPad */}
          {safeMediaItems.length > 1 && (
            <>
              <button
                className="product-swiper-button-prev absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition-all hover:bg-white focus:outline-none md:flex"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="product-swiper-button-next absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition-all hover:bg-white focus:outline-none md:flex"
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Active/Inactive Power Button - TV style, position depends on media type */}
        {isAdmin && productId && (
          <div
            className={cn(
              'source-icon-hover-toggle absolute z-20',
              isCurrentVideo ? 'right-2 top-2' : 'bottom-3 right-5'
            )}
          >
            {isTogglingActive ? (
              <div className="flex h-7 w-7 items-center justify-center">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              </div>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleActive(!optimisticIsActive);
                }}
                disabled={isTogglingActive}
                className={cn(
                  'group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
                  // TV button 3D effect with inset shadow
                  optimisticIsActive
                    ? 'border border-purple-400/30 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(147,51,234,0.4)]'
                    : 'border border-gray-300/50 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)] dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-800 dark:text-gray-400'
                )}
                title={
                  optimisticIsActive
                    ? 'Деактивировать товар'
                    : 'Активировать товар'
                }
              >
                {/* Power symbol - TV style */}
                <svg
                  className={cn(
                    'h-3.5 w-3.5 transition-all duration-200',
                    optimisticIsActive ? 'drop-shadow-sm' : ''
                  )}
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path
                    d="M312.264,51.852v46.714c76.614,23.931,132.22,95.441,132.22,179.94  c0,104.097-84.387,188.484-188.484,188.484l-22.505,22.505L256,512c128.955,0,233.495-104.539,233.495-233.495  C489.495,168.95,414.037,77.034,312.264,51.852z"
                    fill="currentColor"
                  />
                  <g>
                    <path
                      d="M67.516,278.505c0-84.499,55.605-156.009,132.22-179.94V51.852   C97.963,77.034,22.505,168.95,22.505,278.505C22.505,407.461,127.045,512,256,512v-45.011   C151.903,466.989,67.516,382.602,67.516,278.505z"
                      fill="currentColor"
                    />
                    <rect
                      x="233.495"
                      width="45.011"
                      height="278.505"
                      fill="currentColor"
                    />
                  </g>
                </svg>
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  // Desktop layout with thumbnails (large screens only)
  const DesktopLayout = (
    <div className="mx-auto hidden gap-4 xl:flex">
      {/* Left thumbnails */}
      <div className="flex w-20 shrink-0 flex-col gap-2 overflow-y-auto">
        {safeMediaItems.map((media, index) => (
          <button
            key={media.id || index}
            onMouseEnter={() => handleThumbnailHover(index)}
            onMouseLeave={handleThumbnailLeave}
            onFocus={() => goToSlide(index)}
            title={
              media.type === 'video'
                ? `Показать видео ${index + 1}`
                : `Показать фото ${index + 1}`
            }
            aria-label={
              media.type === 'video'
                ? `Показать видео ${index + 1}`
                : `Показать фото ${index + 1}`
            }
            className={`relative aspect-square overflow-hidden rounded-md border transition-colors ${
              index === currentIndex
                ? 'border-purple-600 ring-1 ring-purple-600'
                : 'border-muted hover:border-purple-500'
            }`}
          >
            <div className="relative h-full w-full">
              {media.type === 'video' ? (
                <VideoThumbnail
                  url={media.url}
                  poster={media.poster}
                  alt={media.alt || productName}
                  className="h-full w-full"
                />
              ) : (
                <Image
                  src={media.url}
                  alt={media.alt || productName}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main image/video block */}
      <Card className="group relative flex-1 overflow-hidden rounded-xl shadow-sm">
        <div
          className="product-gallery-main relative w-full"
          style={{ '--gallery-height': `${height}px` } as React.CSSProperties}
        >
          {isCurrentVideo && currentMedia.url ? (
            <>
              <ProductVideoPlayer
                key={`desktop-video-${currentMedia.url}`}
                ref={createVideoPlayerRef(clampedIndex)}
                url={currentMedia.url}
                poster={currentMedia.poster}
                playing={currentVideoState.isPlaying}
                muted={currentVideoState.isMuted}
                loop
                onPlay={handleVideoPlay(clampedIndex)}
                onPause={handleVideoPause(clampedIndex)}
                onProgress={handleVideoProgress(clampedIndex)}
                onDuration={handleVideoDuration(clampedIndex)}
                className="h-full w-full"
              />
              {/* Custom Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-white/90 via-white/70 to-transparent p-2 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  {/* Play/Pause Button */}
                  <button
                    onClick={handlePlayPause}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-purple-800 hover:shadow-xl active:scale-95"
                    aria-label={currentVideoState.isPlaying ? 'Pause' : 'Play'}
                  >
                    {currentVideoState.isPlaying ? (
                      <Pause className="h-3 w-3 text-white" />
                    ) : (
                      <Play className="ml-0.5 h-3 w-3 text-white" />
                    )}
                  </button>

                  {/* Progress Bar */}
                  <div className="flex flex-1 items-center">
                    <input
                      type="range"
                      min="0"
                      max={currentVideoState.duration || 0}
                      value={currentVideoState.playedSeconds || 0}
                      onChange={handleSeek}
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-purple-200/50 accent-purple-500 transition-[background] duration-100 ease-out [&::-moz-range-thumb]:h-0 [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:appearance-none"
                      aria-label="Video progress"
                      title="Перемотка видео"
                      style={{
                        background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${
                          currentVideoState.duration
                            ? ((currentVideoState.playedSeconds || 0) /
                                currentVideoState.duration) *
                              100
                            : 0
                        }%, rgba(196, 181, 253, 0.5) ${
                          currentVideoState.duration
                            ? ((currentVideoState.playedSeconds || 0) /
                                currentVideoState.duration) *
                              100
                            : 0
                        }%, rgba(196, 181, 253, 0.5) 100%)`,
                      }}
                    />
                  </div>

                  {/* Mute/Unmute Button */}
                  <button
                    onClick={handleMuteToggle}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-purple-500/20 text-purple-700 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-purple-500/30 active:scale-95"
                    aria-label={currentVideoState.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {currentVideoState.isMuted ? (
                      <VolumeX className="h-3 w-3 text-purple-700" />
                    ) : (
                      <Volume2 className="h-3 w-3 text-purple-700" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Image
              src={currentMedia?.url || '/images/demo/1.jpg'}
              alt={currentMedia?.alt || productName}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-contain"
              priority={clampedIndex === initialIndex}
            />
          )}
          {!optimisticIsActive && <UnavailableProductOverlay />}
        </div>

        {/* Admin controls - Source and Edit icons */}
        {isAdmin && productId && (
          <div className="absolute left-2 top-2 z-20 flex gap-2">
            {/* Source indicator */}
            {source === 'AG' ? (
              <button
                type="button"
                onClick={async e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!productId) return;

                  // If we already have the screenshot URL, open modal immediately
                  if (sourceScreenshotUrl) {
                    setIsAgSourceModalOpen(true);
                    return;
                  }

                  // Otherwise, fetch product data to get screenshot URL
                  setLoadingProductData(true);
                  setIsAgSourceModalOpen(true); // Open modal immediately, will show loading state
                  try {
                    const response = await fetch(
                      `/api/admin/products/${productId}`
                    );
                    if (response.ok) {
                      const data = await response.json();
                      setProductData(data.product);
                    }
                  } catch (error) {
                    console.error(
                      'Error fetching product data:',
                      error
                    );
                  } finally {
                    setLoadingProductData(false);
                  }
                }}
                className="source-icon-hover-toggle transition-all duration-200 focus:outline-none"
                title="Просмотреть исходный скриншот агрегатора"
              >
                <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                  <AggregatorIcon className="h-full w-full" />
                </div>
              </button>
            ) : sourceMessageIds && sourceMessageIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
                className="source-icon-hover-toggle transition-all duration-200 focus:outline-none"
                title="Просмотр источника сообщений"
              >
                {source === 'WA' ? (
                  <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
                    <Image
                      src="/images/whatsapp-icon.png"
                      alt="WhatsApp"
                      width={48}
                      height={48}
                      className="h-full w-full rounded"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer border-0 bg-purple-500/80 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-purple-600/80"
                  >
                    Источник
                  </Badge>
                )}
              </button>
            ) : null}

            {/* Edit button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="source-icon-hover-toggle inline-flex cursor-pointer items-center justify-center text-white transition-all duration-200 hover:scale-110 focus:outline-none"
              title="Редактировать товар"
            >
              <Pencil className="h-5 w-5 fill-purple-500/20 text-white" />
            </button>
          </div>
        )}

        {/* Active/Inactive Power Button - TV style, position depends on media type */}
        {isAdmin && productId && (
          <div
            className={cn(
              'source-icon-hover-toggle absolute z-20',
              isCurrentVideo ? 'right-2 top-2' : 'bottom-3 right-5'
            )}
          >
            {isTogglingActive ? (
              <div className="flex h-7 w-7 items-center justify-center">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              </div>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleActive(!optimisticIsActive);
                }}
                disabled={isTogglingActive}
                className={cn(
                  'group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
                  // TV button 3D effect with inset shadow
                  optimisticIsActive
                    ? 'border border-purple-400/30 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(147,51,234,0.4)]'
                    : 'border border-gray-300/50 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)] dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-800 dark:text-gray-400'
                )}
                title={
                  optimisticIsActive
                    ? 'Деактивировать товар'
                    : 'Активировать товар'
                }
              >
                {/* Power symbol - TV style */}
                <svg
                  className={cn(
                    'h-3.5 w-3.5 transition-all duration-200',
                    optimisticIsActive ? 'drop-shadow-sm' : ''
                  )}
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path
                    d="M312.264,51.852v46.714c76.614,23.931,132.22,95.441,132.22,179.94  c0,104.097-84.387,188.484-188.484,188.484l-22.505,22.505L256,512c128.955,0,233.495-104.539,233.495-233.495  C489.495,168.95,414.037,77.034,312.264,51.852z"
                    fill="currentColor"
                  />
                  <g>
                    <path
                      d="M67.516,278.505c0-84.499,55.605-156.009,132.22-179.94V51.852   C97.963,77.034,22.505,168.95,22.505,278.505C22.505,407.461,127.045,512,256,512v-45.011   C151.903,466.989,67.516,382.602,67.516,278.505z"
                      fill="currentColor"
                    />
                    <rect
                      x="233.495"
                      width="45.011"
                      height="278.505"
                      fill="currentColor"
                    />
                  </g>
                </svg>
              </button>
            )}
          </div>
        )}

        {safeMediaItems.length > 1 && (
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

  // Only render one layout at a time to prevent duplicate video players
  // Use a hook that works with SSR - start with mobile, then check on client
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1280); // xl breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <>
      {/* Only render one layout to prevent duplicate video players */}
      {!isMounted || !isDesktop
        ? // Mobile/iPad Swiper layout
          MobileSwiper
        : // Desktop layout
          DesktopLayout}
      {isAdmin && productId && (
        <>
          <ProductSourceModal
            isOpen={isSourceModalOpen}
            onClose={() => setIsSourceModalOpen(false)}
            productId={productId}
            productName={productName}
          />
          {/* AG Source Screenshot Modal */}
          {isAgSourceModalOpen && (
            <Modal
              isOpen={isAgSourceModalOpen}
              onClose={() => {
                setIsAgSourceModalOpen(false);
                setProductData(null);
              }}
              title="Исходный скриншот агрегатора"
              size="xl"
              className="md:!max-w-4xl lg:!max-w-5xl [&>div]:!max-h-[85vh] md:[&>div]:!max-h-[90vh]"
            >
              <div className="max-h-[calc(85vh-120px)] overflow-y-auto p-6 md:max-h-[calc(90vh-120px)]">
                {loadingProductData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-gray-50 p-4">
                      {(sourceScreenshotUrl ||
                        productData?.sourceScreenshotUrl) && (
                        <div className="flex justify-center">
                          <Image
                            src={
                              sourceScreenshotUrl ||
                              productData?.sourceScreenshotUrl
                            }
                            alt="Source screenshot from aggregator"
                            width={800}
                            height={600}
                            className="max-h-[400px] w-auto rounded border object-contain"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {!sourceScreenshotUrl &&
                        !productData?.sourceScreenshotUrl && (
                          <div className="py-4 text-center text-gray-500">
                            Скриншот источника не найден
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          )}
          {isEditModalOpen && (
            <EditProductModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              productId={productId}
              categories={categories}
              categoriesLoading={categoriesLoading}
              onProductUpdated={() => {
                setIsEditModalOpen(false);
                // Reload the page to show updated product data
                window.location.reload();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
