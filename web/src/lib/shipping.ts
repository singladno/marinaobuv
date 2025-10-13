export type TransportCompany = {
  id: string;
  name: string;
  eta?: string; // e.g. "Послезавтра" or "2–4 дня"
  priceLabel?: string; // e.g. "Бесплатно" or "от 250 ₽"
  address?: string;
  workingHours?: string;
  // Logo will be provided later; keeping optional for now
  logoUrl?: string;
};

// Popular transport companies in Russia
export const popularTransportCompanies: TransportCompany[] = [
  {
    id: 'cdek',
    name: 'СДЭК',
    logoUrl: '/logos/sdek.png',
  },
  {
    id: 'russian-post',
    name: 'Почта России',
    logoUrl: '/logos/russia_mail.jpg',
  },
  {
    id: 'boxberry',
    name: 'Boxberry',
    logoUrl: '/logos/boxberry.jpg',
  },
  {
    id: 'dpd',
    name: 'DPD',
    logoUrl: '/logos/dpd.png',
  },
  {
    id: 'pickpoint',
    name: 'PickPoint',
    logoUrl: '/logos/pickpoint.png',
  },
  {
    id: 'pek',
    name: 'ПЭК',
    logoUrl: '/logos/pek.jpg',
  },
  {
    id: 'delovye-linii',
    name: 'Деловые линии',
    logoUrl: '/logos/dellin.png',
  },
  {
    id: 'sberlogistics',
    name: 'СберЛогистика',
    logoUrl: '/logos/sber.png',
  },
];
