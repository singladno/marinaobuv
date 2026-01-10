import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

export default function ProductSizes({
  sizes,
  measurementUnit = 'PAIRS',
}: {
  sizes: Array<{ size: string; count: number }>;
  measurementUnit?: 'PAIRS' | 'PIECES';
}) {
  if (!sizes.length) return null;

  const unitLabel = measurementUnit === 'PIECES' ? 'шт' : 'пар';

  // Sizes are already in the correct format
  const uniqueSizes = sizes;
  return (
    <Card className="p-4">
      <Text variant="overline" className="mb-3">
        Таблица размеров
      </Text>
      <div className="grid grid-cols-4 gap-2 text-center text-sm sm:grid-cols-8">
        {uniqueSizes.map(({ size, count }) => (
          <div
            key={size}
            className="border-border bg-background hover:bg-muted/50 rounded border px-2 py-2 transition-colors"
          >
            <div className="font-medium">{size}</div>
            {count > 1 && (
              <div className="text-muted mt-1 text-xs">{count} {unitLabel}</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
