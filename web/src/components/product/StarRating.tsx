'use client';

import { Star } from 'lucide-react';

type Props = {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
};

export function StarRating({
  rating,
  interactive = false,
  onRatingChange,
  size = 'md',
}: Props) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <button
        key={i}
        type="button"
        onClick={() => interactive && onRatingChange?.(i)}
        className={`${sizeClasses[size]} transition-colors ${
          interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
        } ${
          i <= rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 hover:text-yellow-200'
        }`}
      >
        <Star className="h-full w-full" />
      </button>
    );
  }

  return <div className="flex items-center gap-1">{stars}</div>;
}
