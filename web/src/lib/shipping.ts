export type TransportCompany = {
  id: string;
  name: string;
  eta: string; // e.g. "Послезавтра" or "2–4 дня"
  priceLabel: string; // e.g. "Бесплатно" or "от 250 ₽"
  address?: string;
  workingHours?: string;
};

// Popular transport companies in Russia
export const popularTransportCompanies: TransportCompany[] = [
  {
    id: 'cdek',
    name: 'СДЭК',
    eta: 'Послезавтра',
    priceLabel: 'Бесплатно',
    address: 'Москва, Люблинская улица 179/1',
    workingHours: 'Ежедневно: 08:00–22:00',
  },
  {
    id: 'russian-post',
    name: 'Почта России',
    eta: '3–5 дней',
    priceLabel: 'Бесплатно',
    address: 'Москва, Люблинская улица 179/1',
    workingHours: 'Ежедневно: 08:00–22:00',
  },
  {
    id: 'boxberry',
    name: 'Boxberry',
    eta: '2–4 дня',
    priceLabel: 'от 250 ₽',
  },
  { id: 'dpd', name: 'DPD', eta: '2–4 дня', priceLabel: 'от 300 ₽' },
  {
    id: 'pickpoint',
    name: 'PickPoint',
    eta: '2–4 дня',
    priceLabel: 'от 220 ₽',
  },
  { id: 'pek', name: 'ПЭК', eta: '3–6 дней', priceLabel: 'от 400 ₽' },
  {
    id: 'delovye-linii',
    name: 'Деловые линии',
    eta: '3–6 дней',
    priceLabel: 'от 400 ₽',
  },
  {
    id: 'sberlogistics',
    name: 'СберЛогистика',
    eta: '2–4 дня',
    priceLabel: 'от 250 ₽',
  },
];
