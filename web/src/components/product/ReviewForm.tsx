'use client';

import { useState } from 'react';

import { StarRating } from '@/components/product/StarRating';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type ReviewData = {
  rating: number;
  title: string;
  comment: string;
  name: string;
  email: string;
};

type Props = {
  onSubmit: (review: ReviewData) => void;
  onCancel: () => void;
};

export function ReviewForm({ onSubmit, onCancel }: Props) {
  const [review, setReview] = useState<ReviewData>({
    rating: 0,
    title: '',
    comment: '',
    name: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (review.rating > 0) {
      onSubmit(review);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Оставить отзыв</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Оценка *</label>
          <StarRating
            rating={review.rating}
            interactive
            onRatingChange={rating => setReview(prev => ({ ...prev, rating }))}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Заголовок</label>
          <input
            type="text"
            value={review.title}
            onChange={e =>
              setReview(prev => ({ ...prev, title: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Краткое описание вашего опыта"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Имя</label>
          <input
            type="text"
            value={review.name}
            onChange={e =>
              setReview(prev => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Ваше имя"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={review.email}
            onChange={e =>
              setReview(prev => ({ ...prev, email: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Комментарий *
          </label>
          <textarea
            value={review.comment}
            onChange={e =>
              setReview(prev => ({ ...prev, comment: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            rows={4}
            placeholder="Поделитесь своим опытом использования товара"
            required
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={review.rating === 0}>
            Отправить отзыв
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </Card>
  );
}
