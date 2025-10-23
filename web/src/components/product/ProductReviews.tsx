'use client';

import { useState } from 'react';

import { AuthModal } from '@/components/auth/AuthModal';
import { ReviewForm } from '@/components/product/ReviewForm';
import { ReviewList } from '@/components/product/ReviewList';
import { Button } from '@/components/ui/Button';
import { PurchaseRequiredModal } from '@/components/ui/PurchaseRequiredModal';
import { useProductReviews } from '@/hooks/useProductReviews';
import { usePurchaseCheck } from '@/hooks/usePurchaseCheck';
import { useUser } from '@/contexts/NextAuthUserContext';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { data, loading, error, submitReview } = useProductReviews(productId);
  const { user } = useUser();
  const { hasPurchased, loading: purchaseLoading } =
    usePurchaseCheck(productId);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const reviews = data?.reviews || [];

  const handleWriteReview = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!hasPurchased) {
      // Show beautiful modal that user needs to purchase the product first
      setShowPurchaseModal(true);
      return;
    }

    setShowReviewForm(true);
  };

  const handleSubmitReview = async (reviewData: any) => {
    try {
      await submitReview(reviewData);
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Отзывы</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-gray-200"></div>
          <div className="h-32 rounded-lg bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Отзывы</h3>
        <div className="text-center text-red-500">Ошибка загрузки отзывов</div>
        <div className="text-center text-sm text-gray-500">
          Попробуйте обновить страницу
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Отзывы ({reviews.length})</h3>
        <Button onClick={handleWriteReview} disabled={purchaseLoading}>
          Написать отзыв
        </Button>
      </div>

      {showReviewForm && (
        <ReviewForm
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      <ReviewList reviews={reviews} />

      {showLoginModal && (
        <AuthModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {showPurchaseModal && (
        <PurchaseRequiredModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
    </div>
  );
}
