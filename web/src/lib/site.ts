export const site = {
  brand: process.env.NEXT_PUBLIC_BRAND_NAME || 'MarinaObuv',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  links: {
    home: '/',
    catalog: '/catalog',
    about: '/about',
    orders: '/orders',
  },
  socials: {
    instagram: '#',
    telegram: '#',
  },
};
