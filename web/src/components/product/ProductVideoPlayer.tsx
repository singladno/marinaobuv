'use client';

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

export interface ReactPlayerInstance {
  getInternalPlayer: () => HTMLVideoElement | null;
}

interface ProductVideoPlayerProps {
  url: string;
  playing: boolean;
  muted: boolean;
  loop?: boolean;
  poster?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  className?: string;
}

export const ProductVideoPlayer = forwardRef<
  ReactPlayerInstance,
  ProductVideoPlayerProps
>(function ProductVideoPlayer(
  {
    url,
    playing,
    muted,
    loop = true,
    poster,
    onPlay,
    onPause,
    onProgress,
    onDuration,
    className = '',
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    getInternalPlayer: () => videoRef.current,
  }));

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('[ProductVideoPlayer] Play error', err);
        });
      }
    } else {
      video.pause();
    }
  }, [playing]);

  // Handle muted
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
    }
  }, [muted]);

  // Handle duration when metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onDuration) return;

    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        onDuration(video.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (video.duration && isFinite(video.duration)) {
        onDuration(video.duration);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onDuration]);

  // Handle progress updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    const updateProgress = () => {
      if (video.duration && isFinite(video.duration) && video.readyState >= 2) {
        onProgress({
          played: video.currentTime / video.duration,
          playedSeconds: video.currentTime,
        });
      }
    };

    progressIntervalRef.current = setInterval(updateProgress, 500);
    video.addEventListener('timeupdate', updateProgress);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      video.removeEventListener('timeupdate', updateProgress);
    };
  }, [onProgress]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        loop={loop}
        playsInline
        preload="metadata"
        controls={false}
        onClick={e => {
          e.stopPropagation();
          // Toggle play/pause on video click
          const video = videoRef.current;
          if (video) {
            if (video.paused) {
              video.play().catch(err => {
                console.error('[ProductVideoPlayer] Click play error', err);
              });
            } else {
              video.pause();
            }
          }
        }}
        onPlay={() => {
          console.log('[ProductVideoPlayer] Video playing', { url });
          onPlay?.();
        }}
        onPause={() => {
          console.log('[ProductVideoPlayer] Video paused', { url });
          onPause?.();
        }}
        onLoadedMetadata={() => {
          console.log('[ProductVideoPlayer] Video metadata loaded', {
            url,
            duration: videoRef.current?.duration,
            readyState: videoRef.current?.readyState,
          });
        }}
        onError={e => {
          const video = videoRef.current;
          console.error('[ProductVideoPlayer] Video error', {
            url,
            error: video?.error,
            errorCode: video?.error?.code,
            errorMessage: video?.error?.message,
            networkState: video?.networkState,
            readyState: video?.readyState,
            src: video?.src,
            currentSrc: video?.currentSrc,
          });
        }}
        className="h-full w-full cursor-pointer object-contain"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
});
