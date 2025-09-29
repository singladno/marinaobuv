'use client';

import { ThumbsUp, User } from 'lucide-react';

import { StarRating } from '@/components/product/StarRating';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Review = {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  name?: string;
  isVerified: boolean;
  createdAt: string;
};

type Props = {
  review: Review;
};

export function ReviewItem({ review }: Props) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
            <User className="text-muted-foreground h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{review.name || 'Аноним'}</span>
              {review.isVerified && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                  ✓ Подтвержденная покупка
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <span className="text-muted-foreground text-sm">
                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1">
          <ThumbsUp className="h-4 w-4" />
          Полезно
        </Button>
      </div>

      {review.title && <h4 className="mt-3 font-medium">{review.title}</h4>}
      {review.comment && (
        <p className="text-muted-foreground mt-2">{review.comment}</p>
      )}
    </Card>
  );
}
