'use client';

import { Star, MessageSquare, ThumbsUp, User } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
// import { Text } from '@/components/ui/Text';
import { useProductReviews } from '@/hooks/useProductReviews';

// interface Review {
//   id: string;
//   rating: number;
//   title?: string;
//   comment?: string;
//   name?: string;
//   isVerified: boolean;
//   createdAt: string;
// }

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { data, loading, error, submitReview } = useProductReviews(productId);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    comment: '',
    name: '',
    email: '',
  });

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void
  ) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => interactive && onRatingChange?.(i)}
          className={`h-5 w-5 transition-colors ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        >
          <Star className="h-full w-full" />
        </button>
      );
    }
    return stars;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitReview(newReview);
    if (success) {
      setShowReviewForm(false);
      setNewReview({ rating: 0, title: '', comment: '', name: '', email: '' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="bg-muted h-20 animate-pulse rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Ошибка загрузки отзывов: {error}</p>
      </Card>
    );
  }

  const reviews = data?.reviews || [];
  const averageRating = data?.averageRating || 0;
  const totalReviews = data?.totalReviews || 0;

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderStars(Math.floor(averageRating))}
            </div>
            <span className="text-2xl font-bold">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">{totalReviews}</span> отзывов
          </div>
        </div>
        <Button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Написать отзыв
        </Button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Оставить отзыв</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Оценка</label>
              <div className="flex items-center gap-1">
                {renderStars(newReview.rating, true, rating =>
                  setNewReview(prev => ({ ...prev, rating }))
                )}
                <span className="text-muted-foreground ml-2 text-sm">
                  {newReview.rating > 0
                    ? `${newReview.rating} звезд`
                    : 'Выберите оценку'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Имя</label>
                <input
                  type="text"
                  value={newReview.name}
                  onChange={e =>
                    setNewReview(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Ваше имя"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={newReview.email}
                  onChange={e =>
                    setNewReview(prev => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Заголовок отзыва (необязательно)
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={e =>
                  setNewReview(prev => ({ ...prev, title: e.target.value }))
                }
                className="w-full rounded-md border px-3 py-2"
                placeholder="Краткое описание вашего опыта"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Комментарий
              </label>
              <textarea
                value={newReview.comment}
                onChange={e =>
                  setNewReview(prev => ({ ...prev, comment: e.target.value }))
                }
                className="w-full rounded-md border px-3 py-2"
                rows={4}
                placeholder="Поделитесь своим опытом использования товара"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={newReview.rating === 0}>
                Отправить отзыв
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-6 text-center">
            <MessageSquare className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-2 text-lg font-medium">Пока нет отзывов</h3>
            <p className="text-muted-foreground">
              Станьте первым, кто оставит отзыв об этом товаре!
            </p>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                    <User className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {review.name || 'Аноним'}
                      </span>
                      {review.isVerified && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                          ✓ Подтвержденная покупка
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
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

              {review.title && (
                <h4 className="mt-3 font-medium">{review.title}</h4>
              )}

              {review.comment && (
                <p className="text-muted-foreground mt-2">{review.comment}</p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
