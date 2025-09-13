import { env } from './env';

export const site = {
  brand: env.NEXT_PUBLIC_BRAND_NAME,
  url: env.NEXT_PUBLIC_SITE_URL,
  links: {
    home: '/',
    catalog: '/catalog',
    about: '/about',
  },
  socials: {
    instagram: '#',
    telegram: '#',
  },
};
