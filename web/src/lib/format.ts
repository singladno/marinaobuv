export function rub(kopecks: number): string {
  const rubles = (kopecks ?? 0) / 100;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(
    rubles,
  );
}

export const genderRu: Record<string, string> = {
  FEMALE: 'Женское',
  MALE: 'Мужское',
  UNISEX: 'Унисекс',
};

export const seasonRu: Record<string, string> = {
  SPRING: 'Весна',
  SUMMER: 'Лето',
  AUTUMN: 'Осень',
  WINTER: 'Зима',
};

export function sortLabel(key: 'relevance' | 'price-asc' | 'price-desc' | 'newest'): string {
  switch (key) {
    case 'price-asc':
      return 'Сначала дешевле';
    case 'price-desc':
      return 'Сначала дороже';
    case 'newest':
      return 'Новинки';
    case 'relevance':
    default:
      return 'По релевантности';
  }
}

export function ruSize(size: string): string {
  return size;
}
