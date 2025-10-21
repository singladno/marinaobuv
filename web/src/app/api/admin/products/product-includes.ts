export const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  provider: {
    select: {
      id: true,
      name: true,
      phone: true,
      place: true,
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
      isActive: true,
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
