import { useState, useEffect, useCallback } from 'react';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  name?: string;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  page: number;
  totalPages: number;
}

export function useProductReviews(productId: string) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/products/${productId}/reviews?page=${page}&limit=10`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const reviewsData = await response.json();
        setData(reviewsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  const submitReview = async (reviewData: {
    rating: number;
    title?: string;
    comment?: string;
    name: string;
    email: string;
  }) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      // Refresh reviews after successful submission
      await fetchReviews();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      return false;
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, fetchReviews]);

  return {
    data,
    loading,
    error,
    fetchReviews,
    submitReview,
  };
}
