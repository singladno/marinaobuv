import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductSeasonCellProps {
  product: Product;
  season: string | null;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductSeasonCell({
  product,
  season,
  onUpdateProduct,
}: ProductSeasonCellProps) {
  const getSeasonLabel = (season: string | null) => {
    switch (season) {
      case 'SPRING':
        return 'Весна';
      case 'SUMMER':
        return 'Лето';
      case 'AUTUMN':
        return 'Осень';
      case 'WINTER':
        return 'Зима';
      default:
        return '-';
    }
  };

  return (
    <EditableProductCell
      value={getSeasonLabel(season)}
      onSave={value => {
        const seasonMap: Record<string, string | null> = {
          Весна: 'SPRING',
          Лето: 'SUMMER',
          Осень: 'AUTUMN',
          Зима: 'WINTER',
          '-': null,
        };
        onUpdateProduct(product.id, { season: seasonMap[value] || null });
      }}
      type="select"
      options={[
        { value: 'Весна', label: 'Весна' },
        { value: 'Лето', label: 'Лето' },
        { value: 'Осень', label: 'Осень' },
        { value: 'Зима', label: 'Зима' },
        { value: '-', label: '-' },
      ]}
    />
  );
}
