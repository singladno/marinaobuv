interface Product {
  id: string;
  name: string;
  pricePair: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  reviews?: Array<{
    rating: number;
  }>;
  sizes?: Array<{
    stock: number;
  }>;
}

export const sortProducts = (products: Product[], sortBy: string) => {
  switch (sortBy) {
    case 'price-low':
      return products.sort((a, b) => a.pricePair - b.pricePair);
    case 'price-high':
      return products.sort((a, b) => b.pricePair - a.pricePair);
    case 'name':
      return products.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
      return products.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'rating':
      return products.sort((a, b) => {
        const aRating =
          a.reviews && a.reviews.length > 0
            ? a.reviews.reduce(
                (sum: number, review: { rating: number }) =>
                  sum + review.rating,
                0
              ) / a.reviews.length
            : 0;
        const bRating =
          b.reviews && b.reviews.length > 0
            ? b.reviews.reduce(
                (sum: number, review: { rating: number }) =>
                  sum + review.rating,
                0
              ) / b.reviews.length
            : 0;
        return bRating - aRating;
      });
    default:
      return products;
  }
};
