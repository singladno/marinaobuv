'use client';

import { MessageSquare } from 'lucide-react';

import { ReviewItem } from '@/components/product/ReviewItem';
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
  reviews: Review[];
};

export function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="text-muted-foreground mx-auto h-12 w-12" />
        <h3 className="mt-2 text-lg font-medium">Пока нет отзывов</h3>
        <p className="text-muted-foreground">
          Станьте первым, кто оставит отзыв об этом товаре!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
}
