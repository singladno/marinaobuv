import * as React from 'react';

interface ImageModalNavigationProps {
  totalImages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function ImageModalNavigation({
  totalImages,
  onPrevious,
  onNext,
}: ImageModalNavigationProps) {
  if (totalImages <= 1) return null;

  return (
    <>
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-2 text-gray-700 shadow-lg hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Предыдущее изображение"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-2 text-gray-700 shadow-lg hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Следующее изображение"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </>
  );
}
