import ProductSizes from '@/components/product/ProductSizes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { genderRu, rub, seasonRu } from '@/lib/format';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

type Props = {
  name: string;
  article?: string | null;
  pricePair: number;
  description?: string | null;
  material?: string | null;
  gender?: keyof typeof genderRu | null;
  season?: keyof typeof seasonRu | null;
  packPairs?: number | null;
  priceBox?: number | null;
  availabilityCheckedAt?: Date | string | null;
  sizes: Size[];
};

export default function ProductDetails(props: Props) {
  const {
    name,
    article,
    pricePair,
    description,
    material,
    gender,
    season,
    packPairs,
    priceBox,
    availabilityCheckedAt,
    sizes,
  } = props;

  return (
    <div>
      <Text variant="h2" as="h1" className="mb-2">
        {name}
      </Text>
      {article && (
        <Text variant="caption" className="mb-3">
          Артикул: {article}
        </Text>
      )}
      <Text className="mb-4 text-2xl font-semibold">{rub(pricePair)}</Text>
      {description && <Text className="text-muted mb-4">{description}</Text>}

      <div className="flex items-center gap-3">
        <Button size="lg">В корзину</Button>
        <Button variant="outline" size="lg">
          Купить сейчас
        </Button>
      </div>

      <Card className="mt-6 p-4">
        <Text variant="overline" className="mb-2">
          Характеристики
        </Text>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {article && (
            <div>
              <span className="text-muted">Артикул:</span> {article}
            </div>
          )}
          {material && (
            <div>
              <span className="text-muted">Материал:</span> {material}
            </div>
          )}
          {gender && (
            <div>
              <span className="text-muted">Пол:</span> {genderRu[gender]}
            </div>
          )}
          {season && (
            <div>
              <span className="text-muted">Сезон:</span> {seasonRu[season]}
            </div>
          )}
          {packPairs != null && (
            <div>
              <span className="text-muted">Пар в коробке:</span> {packPairs}
            </div>
          )}
          {priceBox != null && (
            <div>
              <span className="text-muted">Цена за коробку:</span>{' '}
              {rub(priceBox)}
            </div>
          )}
          {availabilityCheckedAt && (
            <div>
              <span className="text-muted">Наличие проверено:</span>{' '}
              {new Date(availabilityCheckedAt).toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
      </Card>

      <ProductSizes sizes={sizes} />
    </div>
  );
}
