export const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      key: true,
      alt: true,
      sort: true,
      isPrimary: true,
      color: true,
      width: true,
      height: true,
    },
    orderBy: { sort: 'asc' },
  },
  _count: {
    select: {
      reviews: true,
      orderItems: true,
    },
  },
} as const;
