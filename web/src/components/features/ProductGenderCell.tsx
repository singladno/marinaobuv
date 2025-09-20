import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductGenderCellProps {
  product: Product;
  gender: string | null;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductGenderCell({
  product,
  gender,
  onUpdateProduct,
}: ProductGenderCellProps) {
  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'FEMALE':
        return 'Женский';
      case 'MALE':
        return 'Мужской';
      case 'UNISEX':
        return 'Унисекс';
      default:
        return '-';
    }
  };

  return (
    <EditableProductCell
      value={getGenderLabel(gender)}
      onSave={value => {
        const genderMap: Record<string, string | null> = {
          Женский: 'FEMALE',
          Мужской: 'MALE',
          Унисекс: 'UNISEX',
          '-': null,
        };
        onUpdateProduct(product.id, { gender: genderMap[value] || null });
      }}
      type="select"
      options={[
        { value: 'Женский', label: 'Женский' },
        { value: 'Мужской', label: 'Мужской' },
        { value: 'Унисекс', label: 'Унисекс' },
        { value: '-', label: '-' },
      ]}
    />
  );
}
