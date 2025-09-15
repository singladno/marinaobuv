import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

function renderQty(stock?: number | null, perBox?: number | null) {
  const a = stock;
  const b = typeof perBox === 'number' ? perBox : null;
  if (a != null && b != null) return `${a} / ${b}`;
  if (a != null) return `${a}`;
  if (b != null) return `${b}`;
  return null;
}

export default function ProductSizes({ sizes }: { sizes: Size[] }) {
  if (!sizes.length) return null;
  return (
    <Card className="mt-4 p-4">
      <Text variant="overline" className="mb-2">
        Размеры
      </Text>
      <div className="grid grid-cols-4 gap-2 text-center text-sm sm:grid-cols-8">
        {sizes.map(s => (
          <div
            key={s.id}
            className="border-border bg-background rounded border px-2 py-1"
          >
            <div className="font-medium">{s.size}</div>
            {(s.stock != null || s.perBox != null) && (
              <div className="text-muted text-xs">
                {renderQty(s.stock, s.perBox)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
